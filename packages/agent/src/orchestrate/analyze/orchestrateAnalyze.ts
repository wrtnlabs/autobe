import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeHistory,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteModuleReviewEvent,
  AutoBeAnalyzeWriteUnitEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAssistantMessageHistory,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { orchestrateAnalyzeScenario } from "./orchestrateAnalyzeScenario";
import { orchestrateAnalyzeWriteModule } from "./orchestrateAnalyzeWriteModule";
import { orchestrateAnalyzeWriteModuleReview } from "./orchestrateAnalyzeWriteModuleReview";
import { orchestrateAnalyzeWriteUnit } from "./orchestrateAnalyzeWriteUnit";
import { orchestrateAnalyzeWriteAllUnitsReview } from "./orchestrateAnalyzeWriteAllUnitsReview";
import { orchestrateAnalyzeWriteSection } from "./orchestrateAnalyzeWriteSection";
import { orchestrateAnalyzeWriteAllSectionsReview } from "./orchestrateAnalyzeWriteAllSectionsReview";

const MAX_RETRIES = 3;

export const orchestrateAnalyze = async (
  ctx: AutoBeContext,
): Promise<AutoBeAssistantMessageHistory | AutoBeAnalyzeHistory> => {
  // Initialize analysis state
  const step: number = (ctx.state().analyze?.step ?? -1) + 1;
  const startTime: Date = new Date();

  ctx.dispatch({
    type: "analyzeStart",
    id: v7(),
    step,
    created_at: startTime.toISOString(),
  });

  // Generate analysis scenario
  const scenario: AutoBeAnalyzeScenarioEvent | AutoBeAssistantMessageHistory =
    await orchestrateAnalyzeScenario(ctx);
  if (scenario.type === "assistantMessage")
    return ctx.assistantMessage(scenario);
  else ctx.dispatch(scenario);

  // Process each file with hierarchical write flow
  const progress: AutoBeProgressEventBase = {
    total: scenario.files.length,
    completed: 0,
  };

  const files: AutoBeAnalyzeFile[] = await Promise.all(
    scenario.files.map(async (file) => {
      const content = await processFileHierarchical(ctx, {
        scenario,
        file,
        progress,
      });
      return {
        ...file,
        content,
      };
    }),
  );
  progress.completed = files.length;

  // Complete the analysis
  return ctx.dispatch({
    type: "analyzeComplete",
    id: v7(),
    actors: scenario.actors,
    prefix: scenario.prefix,
    files,
    aggregates: ctx.getCurrentAggregates("analyze"),
    step,
    elapsed: new Date().getTime() - startTime.getTime(),
    created_at: new Date().toISOString(),
  }) satisfies AutoBeAnalyzeHistory;
};

/**
 * Process a single file through the hierarchical Module → Unit → Section flow
 */
async function processFileHierarchical(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    progress: AutoBeProgressEventBase;
  },
): Promise<string> {
  const moduleResult = await writeAndReviewModule(ctx, props);

  let unitResults: AutoBeAnalyzeWriteUnitEvent[] = [];
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    unitResults = [];
    for (let moduleIndex = 0; moduleIndex < moduleResult.moduleSections.length; moduleIndex++) {
      const unitEvent = await orchestrateAnalyzeWriteUnit(ctx, {
        scenario: props.scenario,
        file: props.file,
        moduleEvent: moduleResult,
        moduleIndex,
        progress: props.progress,
      });
      unitResults.push(unitEvent);
    }

    const unitReviewResult = await reviewAllUnits(ctx, {
      ...props,
      moduleEvent: moduleResult,
      unitEvents: unitResults,
    });

    if (unitReviewResult.allApproved) {
      unitResults = unitReviewResult.reviewedUnits;
      break;
    }
  }

  let sectionResults: AutoBeAnalyzeWriteSectionEvent[][] = [];
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    sectionResults = [];
    for (let moduleIndex = 0; moduleIndex < unitResults.length; moduleIndex++) {
      const unitEvent = unitResults[moduleIndex]!;
      const sectionsForModule: AutoBeAnalyzeWriteSectionEvent[] = [];
      for (let unitIndex = 0; unitIndex < unitEvent.unitSections.length; unitIndex++) {
        const sectionEvent = await orchestrateAnalyzeWriteSection(ctx, {
          scenario: props.scenario,
          file: props.file,
          moduleEvent: moduleResult,
          unitEvent,
          moduleIndex,
          unitIndex,
          progress: props.progress,
        });
        sectionsForModule.push(sectionEvent);
      }
      sectionResults.push(sectionsForModule);
    }

    const sectionReviewResult = await reviewAllSections(ctx, {
      ...props,
      moduleEvent: moduleResult,
      unitEvents: unitResults,
      sectionEvents: sectionResults,
    });

    if (sectionReviewResult.allApproved) {
      sectionResults = sectionReviewResult.reviewedSections;
      break;
    }
  }

  // Step 4: Assemble final content
  return assembleContent(moduleResult, unitResults, sectionResults);
}

/**
 * Review all Units at once in a SINGLE LLM call.
 * Returns allApproved=false if the batch review rejects.
 */
async function reviewAllUnits(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvents: AutoBeAnalyzeWriteUnitEvent[];
    progress: AutoBeProgressEventBase;
  },
): Promise<{ allApproved: boolean; reviewedUnits: AutoBeAnalyzeWriteUnitEvent[] }> {
  // Single LLM call to review ALL units at once
  const reviewEvent = await orchestrateAnalyzeWriteAllUnitsReview(ctx, {
    scenario: props.scenario,
    file: props.file,
    moduleEvent: props.moduleEvent,
    unitEvents: props.unitEvents,
    progress: props.progress,
  });

  if (!reviewEvent.approved) {
    return { allApproved: false, reviewedUnits: [] };
  }

  // Apply revisions if provided
  const reviewedUnits = applyAllUnitRevisions(props.unitEvents, reviewEvent);
  return { allApproved: true, reviewedUnits };
}

/**
 * Review all Sections at once in a SINGLE LLM call.
 * Returns allApproved=false if the batch review rejects.
 */
async function reviewAllSections(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvents: AutoBeAnalyzeWriteUnitEvent[];
    sectionEvents: AutoBeAnalyzeWriteSectionEvent[][];
    progress: AutoBeProgressEventBase;
  },
): Promise<{ allApproved: boolean; reviewedSections: AutoBeAnalyzeWriteSectionEvent[][] }> {
  // Single LLM call to review ALL sections at once
  const reviewEvent = await orchestrateAnalyzeWriteAllSectionsReview(ctx, {
    scenario: props.scenario,
    file: props.file,
    moduleEvent: props.moduleEvent,
    unitEvents: props.unitEvents,
    sectionEvents: props.sectionEvents,
    progress: props.progress,
  });

  if (!reviewEvent.approved) {
    return { allApproved: false, reviewedSections: [] };
  }

  // Apply revisions if provided
  const reviewedSections = applyAllSectionRevisions(props.sectionEvents, reviewEvent);
  return { allApproved: true, reviewedSections };
}

/**
 * Write Module sections with review and retry on failure
 */
async function writeAndReviewModule(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    progress: AutoBeProgressEventBase;
  },
): Promise<AutoBeAnalyzeWriteModuleEvent> {
  let feedback: string | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const moduleEvent = await orchestrateAnalyzeWriteModule(ctx, {
      scenario: props.scenario,
      file: props.file,
      progress: props.progress,
      feedback,
    });

    const reviewEvent: AutoBeAnalyzeWriteModuleReviewEvent =
      await orchestrateAnalyzeWriteModuleReview(ctx, {
        scenario: props.scenario,
        file: props.file,
        moduleEvent,
        progress: props.progress,
      });

    if (reviewEvent.approved) {
      // Apply revisions if provided
      return applyModuleRevisions(moduleEvent, reviewEvent);
    }

    feedback = reviewEvent.feedback;
  }

  throw new Error("[orchestrateAnalyze] Module write failed after max retries");
}

/**
 * Apply module review revisions to the module event
 */
function applyModuleRevisions(
  moduleEvent: AutoBeAnalyzeWriteModuleEvent,
  reviewEvent: AutoBeAnalyzeWriteModuleReviewEvent,
): AutoBeAnalyzeWriteModuleEvent {
  return {
    ...moduleEvent,
    title: reviewEvent.revisedTitle ?? moduleEvent.title,
    summary: reviewEvent.revisedSummary ?? moduleEvent.summary,
    moduleSections: reviewEvent.revisedSections ?? moduleEvent.moduleSections,
  };
}

/**
 * Apply batch unit review revisions to all unit events
 */
function applyAllUnitRevisions(
  unitEvents: AutoBeAnalyzeWriteUnitEvent[],
  reviewEvent: { revisedUnits?: Array<{ moduleIndex: number; unitSections: AutoBeAnalyzeWriteUnitEvent.IUnitSection[] }> },
): AutoBeAnalyzeWriteUnitEvent[] {
  if (!reviewEvent.revisedUnits) {
    return unitEvents;
  }

  // Create a map of revisions by moduleIndex
  const revisionsMap = new Map<number, AutoBeAnalyzeWriteUnitEvent.IUnitSection[]>();
  for (const revision of reviewEvent.revisedUnits) {
    revisionsMap.set(revision.moduleIndex, revision.unitSections);
  }

  // Apply revisions where available
  return unitEvents.map((unitEvent, moduleIndex) => {
    const revisedSections = revisionsMap.get(moduleIndex);
    if (revisedSections) {
      return { ...unitEvent, unitSections: revisedSections };
    }
    return unitEvent;
  });
}

/**
 * Apply batch section review revisions to all section events
 */
function applyAllSectionRevisions(
  sectionEvents: AutoBeAnalyzeWriteSectionEvent[][],
  reviewEvent: {
    revisedSections?: Array<{
      moduleIndex: number;
      units: Array<{
        unitIndex: number;
        sectionSections: AutoBeAnalyzeWriteSectionEvent.ISectionSection[];
      }>;
    }>;
  },
): AutoBeAnalyzeWriteSectionEvent[][] {
  if (!reviewEvent.revisedSections) {
    return sectionEvents;
  }

  // Create a nested map of revisions by moduleIndex and unitIndex
  const revisionsMap = new Map<number, Map<number, AutoBeAnalyzeWriteSectionEvent.ISectionSection[]>>();
  for (const moduleRevision of reviewEvent.revisedSections) {
    const unitMap = new Map<number, AutoBeAnalyzeWriteSectionEvent.ISectionSection[]>();
    for (const unitRevision of moduleRevision.units) {
      unitMap.set(unitRevision.unitIndex, unitRevision.sectionSections);
    }
    revisionsMap.set(moduleRevision.moduleIndex, unitMap);
  }

  // Apply revisions where available
  return sectionEvents.map((sectionsForModule, moduleIndex) => {
    const unitMap = revisionsMap.get(moduleIndex);
    if (!unitMap) {
      return sectionsForModule;
    }

    return sectionsForModule.map((sectionEvent, unitIndex) => {
      const revisedSections = unitMap.get(unitIndex);
      if (revisedSections) {
        return { ...sectionEvent, sectionSections: revisedSections };
      }
      return sectionEvent;
    });
  });
}

/**
 * Assemble all sections into final markdown content
 */
function assembleContent(
  moduleEvent: AutoBeAnalyzeWriteModuleEvent,
  unitEvents: AutoBeAnalyzeWriteUnitEvent[],
  sectionResults: AutoBeAnalyzeWriteSectionEvent[][],
): string {
  const lines: string[] = [];

  // Document title and summary
  lines.push(`# ${moduleEvent.title}`);
  lines.push("");
  lines.push(moduleEvent.summary);
  lines.push("");

  // For each module section
  for (let moduleIndex = 0; moduleIndex < moduleEvent.moduleSections.length; moduleIndex++) {
    const moduleSection = moduleEvent.moduleSections[moduleIndex]!;
    const unitEvent = unitEvents[moduleIndex];
    const sectionEventsForModule = sectionResults[moduleIndex];

    // Module section header
    lines.push(`## ${moduleSection.title}`);
    lines.push("");
    if (moduleSection.content) {
      lines.push(moduleSection.content);
      lines.push("");
    }

    // For each unit section
    if (unitEvent) {
      for (let unitIndex = 0; unitIndex < unitEvent.unitSections.length; unitIndex++) {
        const unitSection = unitEvent.unitSections[unitIndex]!;
        const sectionEvent = sectionEventsForModule?.[unitIndex];

        // Unit section header
        lines.push(`### ${unitSection.title}`);
        lines.push("");
        if (unitSection.content) {
          lines.push(unitSection.content);
          lines.push("");
        }

        // For each section section
        if (sectionEvent) {
          for (const sectionSection of sectionEvent.sectionSections) {
            lines.push(`#### ${sectionSection.title}`);
            lines.push("");
            lines.push(sectionSection.content);
            lines.push("");
          }
        }
      }
    }
  }

  return lines.join("\n").trim();
}
