import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeHistory,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteModuleReviewEvent,
  AutoBeAnalyzeWriteUnitEvent,
  AutoBeAnalyzeWriteUnitReviewEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteSectionReviewEvent,
  AutoBeAssistantMessageHistory,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { orchestrateAnalyzeScenario } from "./orchestrateAnalyzeScenario";
import { orchestrateAnalyzeWriteModule } from "./orchestrateAnalyzeWriteModule";
import { orchestrateAnalyzeWriteModuleReview } from "./orchestrateAnalyzeWriteModuleReview";
import { orchestrateAnalyzeWriteUnit } from "./orchestrateAnalyzeWriteUnit";
import { orchestrateAnalyzeWriteUnitReview } from "./orchestrateAnalyzeWriteUnitReview";
import { orchestrateAnalyzeWriteSection } from "./orchestrateAnalyzeWriteSection";
import { orchestrateAnalyzeWriteSectionReview } from "./orchestrateAnalyzeWriteSectionReview";

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

  const files: AutoBeAnalyzeFile[] = await executeCachedBatch(
    ctx,
    scenario.files.map((file) => async (promptCacheKey) => {
      const content = await processFileHierarchical(ctx, {
        scenario,
        file,
        progress,
        promptCacheKey,
      });
      progress.completed++;
      return {
        ...file,
        content,
      };
    }),
  );

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
    promptCacheKey: string;
  },
): Promise<string> {
  // Step 1: Module Write → Review
  const moduleResult = await writeAndReviewModule(ctx, props);

  // Step 2: For each module section, do Unit Write → Review
  const unitResults: AutoBeAnalyzeWriteUnitEvent[] = [];
  for (let moduleIndex = 0; moduleIndex < moduleResult.moduleSections.length; moduleIndex++) {
    const unitResult = await writeAndReviewUnit(ctx, {
      ...props,
      moduleEvent: moduleResult,
      moduleIndex,
    });
    unitResults.push(unitResult);
  }

  // Step 3: For each unit section, do Section Write → Review
  const sectionResults: AutoBeAnalyzeWriteSectionEvent[][] = [];
  for (let moduleIndex = 0; moduleIndex < unitResults.length; moduleIndex++) {
    const unitEvent = unitResults[moduleIndex]!;
    const sectionsForModule: AutoBeAnalyzeWriteSectionEvent[] = [];

    for (let unitIndex = 0; unitIndex < unitEvent.unitSections.length; unitIndex++) {
      const sectionResult = await writeAndReviewSection(ctx, {
        ...props,
        moduleEvent: moduleResult,
        unitEvent,
        moduleIndex,
        unitIndex,
      });
      sectionsForModule.push(sectionResult);
    }
    sectionResults.push(sectionsForModule);
  }

  // Step 4: Assemble final content
  return assembleContent(moduleResult, unitResults, sectionResults);
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
    promptCacheKey: string;
  },
): Promise<AutoBeAnalyzeWriteModuleEvent> {
  let feedback: string | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const moduleEvent = await orchestrateAnalyzeWriteModule(ctx, {
      scenario: props.scenario,
      file: props.file,
      progress: props.progress,
      feedback,
      promptCacheKey: props.promptCacheKey,
    });

    const reviewEvent: AutoBeAnalyzeWriteModuleReviewEvent =
      await orchestrateAnalyzeWriteModuleReview(ctx, {
        scenario: props.scenario,
        file: props.file,
        moduleEvent,
        progress: props.progress,
        promptCacheKey: props.promptCacheKey,
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
 * Write Unit sections with review and retry on failure
 */
async function writeAndReviewUnit(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    moduleIndex: number;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeAnalyzeWriteUnitEvent> {
  let feedback: string | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const unitEvent = await orchestrateAnalyzeWriteUnit(ctx, {
      scenario: props.scenario,
      file: props.file,
      moduleEvent: props.moduleEvent,
      moduleIndex: props.moduleIndex,
      progress: props.progress,
      feedback,
      promptCacheKey: props.promptCacheKey,
    });

    const reviewEvent: AutoBeAnalyzeWriteUnitReviewEvent =
      await orchestrateAnalyzeWriteUnitReview(ctx, {
        scenario: props.scenario,
        file: props.file,
        moduleEvent: props.moduleEvent,
        unitEvent,
        progress: props.progress,
        promptCacheKey: props.promptCacheKey,
      });

    if (reviewEvent.approved) {
      // Apply revisions if provided
      return applyUnitRevisions(unitEvent, reviewEvent);
    }

    feedback = reviewEvent.feedback;
  }

  throw new Error("[orchestrateAnalyze] Unit write failed after max retries");
}

/**
 * Write Section sections with review and retry on failure
 */
async function writeAndReviewSection(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvent: AutoBeAnalyzeWriteUnitEvent;
    moduleIndex: number;
    unitIndex: number;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeAnalyzeWriteSectionEvent> {
  let feedback: string | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const sectionEvent = await orchestrateAnalyzeWriteSection(ctx, {
      scenario: props.scenario,
      file: props.file,
      moduleEvent: props.moduleEvent,
      unitEvent: props.unitEvent,
      moduleIndex: props.moduleIndex,
      unitIndex: props.unitIndex,
      progress: props.progress,
      feedback,
      promptCacheKey: props.promptCacheKey,
    });

    const reviewEvent: AutoBeAnalyzeWriteSectionReviewEvent =
      await orchestrateAnalyzeWriteSectionReview(ctx, {
        scenario: props.scenario,
        file: props.file,
        moduleEvent: props.moduleEvent,
        unitEvent: props.unitEvent,
        sectionEvent,
        progress: props.progress,
        promptCacheKey: props.promptCacheKey,
      });

    if (reviewEvent.approved) {
      // Apply revisions if provided
      return applySectionRevisions(sectionEvent, reviewEvent);
    }

    feedback = reviewEvent.feedback;
  }

  throw new Error("[orchestrateAnalyze] Section write failed after max retries");
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
 * Apply unit review revisions to the unit event
 */
function applyUnitRevisions(
  unitEvent: AutoBeAnalyzeWriteUnitEvent,
  reviewEvent: AutoBeAnalyzeWriteUnitReviewEvent,
): AutoBeAnalyzeWriteUnitEvent {
  return {
    ...unitEvent,
    unitSections: reviewEvent.revisedSections ?? unitEvent.unitSections,
  };
}

/**
 * Apply section review revisions to the section event
 */
function applySectionRevisions(
  sectionEvent: AutoBeAnalyzeWriteSectionEvent,
  reviewEvent: AutoBeAnalyzeWriteSectionReviewEvent,
): AutoBeAnalyzeWriteSectionEvent {
  return {
    ...sectionEvent,
    sectionSections: reviewEvent.revisedSections ?? sectionEvent.sectionSections,
  };
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
