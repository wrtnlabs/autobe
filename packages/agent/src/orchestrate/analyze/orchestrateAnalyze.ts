import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeHistory,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteAllSectionReviewEvent,
  AutoBeAnalyzeWriteAllUnitReviewEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteModuleReviewEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteUnitEvent,
  AutoBeAssistantMessageHistory,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { forceRetry } from "../../utils/forceRetry";
import { orchestrateAnalyzeScenario } from "./orchestrateAnalyzeScenario";
import { orchestrateAnalyzeWriteAllSectionReview } from "./orchestrateAnalyzeWriteAllSectionReview";
import { orchestrateAnalyzeWriteAllUnitReview } from "./orchestrateAnalyzeWriteAllUnitReview";
import { orchestrateAnalyzeWriteModule } from "./orchestrateAnalyzeWriteModule";
import { orchestrateAnalyzeWriteModuleReview } from "./orchestrateAnalyzeWriteModuleReview";
import { orchestrateAnalyzeWriteSection } from "./orchestrateAnalyzeWriteSection";
import { orchestrateAnalyzeWriteUnit } from "./orchestrateAnalyzeWriteUnit";

interface IUnitReviewResult {
  allApproved: boolean;
  feedback: string;
  reviewedUnits: AutoBeAnalyzeWriteUnitEvent[];
}

interface ISectionReviewResult {
  allApproved: boolean;
  feedback: string;
  reviewedSections: AutoBeAnalyzeWriteSectionEvent[][];
}

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
      const content: string = await forceRetry(() =>
        processFileHierarchical(ctx, {
          scenario,
          file,
          progress,
          promptCacheKey,
        }),
      );
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

/** Process a single file through the hierarchical Module → Unit → Section flow */
async function processFileHierarchical(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<string> {
  // Consecutive error tracking for fast-fail on repeated failures
  let consecutiveErrors: number = 0;

  async function withErrorTracking<T>(task: () => Promise<T>): Promise<T> {
    try {
      const result: T = await task();
      consecutiveErrors = 0; // Reset on success
      return result;
    } catch (error) {
      consecutiveErrors++;
      if (consecutiveErrors >= AutoBeConfigConstant.ANALYZE_CONSECUTIVE_ERROR) {
        throw new Error(
          `[orchestrateAnalyze] Exceeded ${AutoBeConfigConstant.ANALYZE_CONSECUTIVE_ERROR} consecutive errors. ` +
            `Last error: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      throw error;
    }
  }

  const moduleResult: AutoBeAnalyzeWriteModuleEvent = await withErrorTracking(
    () => writeAndReviewModule(ctx, props),
  );

  let unitResults: AutoBeAnalyzeWriteUnitEvent[] = [];
  let unitApproved: boolean = false;
  let unitFeedback: string | undefined;
  for (
    let attempt: number = 0;
    attempt < AutoBeConfigConstant.ANALYZE_RETRY;
    attempt++
  ) {
    unitResults = [];
    for (
      let moduleIndex: number = 0;
      moduleIndex < moduleResult.moduleSections.length;
      moduleIndex++
    ) {
      const unitEvent: AutoBeAnalyzeWriteUnitEvent = await withErrorTracking(
        () =>
          orchestrateAnalyzeWriteUnit(ctx, {
            scenario: props.scenario,
            file: props.file,
            moduleEvent: moduleResult,
            moduleIndex,
            progress: props.progress,
            promptCacheKey: props.promptCacheKey,
            feedback: unitFeedback,
          }),
      );
      unitResults.push(unitEvent);
    }

    const unitReviewResult: IUnitReviewResult = await withErrorTracking(() =>
      reviewAllUnits(ctx, {
        ...props,
        moduleEvent: moduleResult,
        unitEvents: unitResults,
      }),
    );

    if (unitReviewResult.allApproved) {
      unitResults = unitReviewResult.reviewedUnits;
      unitApproved = true;
      break;
    }
    unitFeedback = unitReviewResult.feedback;
  }

  if (!unitApproved) {
    throw new Error(
      "[orchestrateAnalyze] Unit generation failed after max retries",
    );
  }

  let sectionResults: AutoBeAnalyzeWriteSectionEvent[][] = [];
  let sectionApproved: boolean = false;
  let sectionFeedback: string | undefined;
  for (
    let attempt: number = 0;
    attempt < AutoBeConfigConstant.ANALYZE_RETRY;
    attempt++
  ) {
    sectionResults = [];
    for (
      let moduleIndex: number = 0;
      moduleIndex < unitResults.length;
      moduleIndex++
    ) {
      const unitEvent: AutoBeAnalyzeWriteUnitEvent = unitResults[moduleIndex]!;
      const sectionsForModule: AutoBeAnalyzeWriteSectionEvent[] = [];
      for (
        let unitIndex: number = 0;
        unitIndex < unitEvent.unitSections.length;
        unitIndex++
      ) {
        const sectionEvent: AutoBeAnalyzeWriteSectionEvent =
          await withErrorTracking(() =>
            orchestrateAnalyzeWriteSection(ctx, {
              scenario: props.scenario,
              file: props.file,
              moduleEvent: moduleResult,
              unitEvent,
              moduleIndex,
              unitIndex,
              progress: props.progress,
              promptCacheKey: props.promptCacheKey,
              feedback: sectionFeedback,
            }),
          );
        sectionsForModule.push(sectionEvent);
      }
      sectionResults.push(sectionsForModule);
    }

    const sectionReviewResult: ISectionReviewResult = await withErrorTracking(
      () =>
        reviewAllSections(ctx, {
          ...props,
          moduleEvent: moduleResult,
          unitEvents: unitResults,
          sectionEvents: sectionResults,
        }),
    );

    if (sectionReviewResult.allApproved) {
      sectionResults = sectionReviewResult.reviewedSections;
      sectionApproved = true;
      break;
    }
    sectionFeedback = sectionReviewResult.feedback;
  }

  if (!sectionApproved) {
    throw new Error(
      "[orchestrateAnalyze] Section generation failed after max retries",
    );
  }

  // Step 4: Assemble final content
  return assembleContent(moduleResult, unitResults, sectionResults);
}

/**
 * Review all Units at once in a SINGLE LLM call. Returns allApproved=false if
 * the batch review rejects.
 */
async function reviewAllUnits(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    moduleEvent: AutoBeAnalyzeWriteModuleEvent;
    unitEvents: AutoBeAnalyzeWriteUnitEvent[];
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<IUnitReviewResult> {
  // Single LLM call to review ALL units at once
  const reviewEvent: AutoBeAnalyzeWriteAllUnitReviewEvent =
    await orchestrateAnalyzeWriteAllUnitReview(ctx, {
      scenario: props.scenario,
      file: props.file,
      moduleEvent: props.moduleEvent,
      unitEvents: props.unitEvents,
      progress: props.progress,
      promptCacheKey: props.promptCacheKey,
    });

  if (!reviewEvent.approved) {
    return {
      allApproved: false,
      feedback: reviewEvent.feedback,
      reviewedUnits: [],
    };
  }

  // Apply revisions if provided
  const reviewedUnits: AutoBeAnalyzeWriteUnitEvent[] = applyAllUnitRevisions(
    props.unitEvents,
    reviewEvent,
  );
  return { allApproved: true, feedback: reviewEvent.feedback, reviewedUnits };
}

/**
 * Review all Sections at once in a SINGLE LLM call. Returns allApproved=false
 * if the batch review rejects.
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
    promptCacheKey: string;
  },
): Promise<ISectionReviewResult> {
  // Single LLM call to review ALL sections at once
  const reviewEvent: AutoBeAnalyzeWriteAllSectionReviewEvent =
    await orchestrateAnalyzeWriteAllSectionReview(ctx, {
      scenario: props.scenario,
      file: props.file,
      moduleEvent: props.moduleEvent,
      unitEvents: props.unitEvents,
      sectionEvents: props.sectionEvents,
      progress: props.progress,
      promptCacheKey: props.promptCacheKey,
    });

  if (!reviewEvent.approved) {
    return {
      allApproved: false,
      feedback: reviewEvent.feedback,
      reviewedSections: [],
    };
  }

  // Apply revisions if provided
  const reviewedSections: AutoBeAnalyzeWriteSectionEvent[][] =
    applyAllSectionRevisions(props.sectionEvents, reviewEvent);
  return {
    allApproved: true,
    feedback: reviewEvent.feedback,
    reviewedSections,
  };
}

/** Write Module sections with review and retry on failure */
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
  let lastError: Error | undefined;

  for (
    let attempt: number = 0;
    attempt < AutoBeConfigConstant.ANALYZE_RETRY;
    attempt++
  ) {
    try {
      const moduleEvent: AutoBeAnalyzeWriteModuleEvent =
        await orchestrateAnalyzeWriteModule(ctx, {
          scenario: props.scenario,
          file: props.file,
          progress: props.progress,
          promptCacheKey: props.promptCacheKey,
          feedback,
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
    } catch (error) {
      // Retry on next attempt if error occurs (e.g., RAG_LIMIT exceeded)
      lastError = error instanceof Error ? error : new Error(String(error));
      feedback = `Previous attempt failed with error: ${lastError.message}. Please try again.`;
    }
  }

  throw (
    lastError ??
    new Error("[orchestrateAnalyze] Module write failed after max retries")
  );
}

/** Apply module review revisions to the module event */
function applyModuleRevisions(
  moduleEvent: AutoBeAnalyzeWriteModuleEvent,
  reviewEvent: AutoBeAnalyzeWriteModuleReviewEvent,
): AutoBeAnalyzeWriteModuleEvent {
  return {
    ...moduleEvent,
    title: reviewEvent.revisedTitle?.length
      ? reviewEvent.revisedTitle
      : moduleEvent.title,
    summary: reviewEvent.revisedSummary?.length
      ? reviewEvent.revisedSummary
      : moduleEvent.summary,
    moduleSections: reviewEvent.revisedSections?.length
      ? reviewEvent.revisedSections
      : moduleEvent.moduleSections,
  };
}

/** Apply batch unit review revisions to all unit events */
function applyAllUnitRevisions(
  unitEvents: AutoBeAnalyzeWriteUnitEvent[],
  reviewEvent: Pick<AutoBeAnalyzeWriteAllUnitReviewEvent, "revisedUnits">,
): AutoBeAnalyzeWriteUnitEvent[] {
  if (!reviewEvent.revisedUnits) {
    return unitEvents;
  }

  // Create a map of revisions by moduleIndex
  const revisionsMap: Map<number, AutoBeAnalyzeWriteUnitEvent.IUnitSection[]> =
    new Map();
  for (const revision of reviewEvent.revisedUnits) {
    revisionsMap.set(revision.moduleIndex, revision.unitSections);
  }

  // Apply revisions where available
  return unitEvents.map((unitEvent, moduleIndex) => {
    const revisedSections:
      | AutoBeAnalyzeWriteUnitEvent.IUnitSection[]
      | undefined = revisionsMap.get(moduleIndex);
    if (revisedSections) {
      return { ...unitEvent, unitSections: revisedSections };
    }
    return unitEvent;
  });
}

/** Apply batch section review revisions to all section events */
function applyAllSectionRevisions(
  sectionEvents: AutoBeAnalyzeWriteSectionEvent[][],
  reviewEvent: Pick<AutoBeAnalyzeWriteAllSectionReviewEvent, "revisedSections">,
): AutoBeAnalyzeWriteSectionEvent[][] {
  if (!reviewEvent.revisedSections) {
    return sectionEvents;
  }

  // Create a nested map of revisions by moduleIndex and unitIndex
  const revisionsMap: Map<
    number,
    Map<number, AutoBeAnalyzeWriteSectionEvent.ISectionSection[]>
  > = new Map();
  for (const moduleRevision of reviewEvent.revisedSections) {
    const unitMap: Map<
      number,
      AutoBeAnalyzeWriteSectionEvent.ISectionSection[]
    > = new Map();
    for (const unitRevision of moduleRevision.units) {
      unitMap.set(unitRevision.unitIndex, unitRevision.sectionSections);
    }
    revisionsMap.set(moduleRevision.moduleIndex, unitMap);
  }

  // Apply revisions where available
  return sectionEvents.map((sectionsForModule, moduleIndex) => {
    const unitMap:
      | Map<number, AutoBeAnalyzeWriteSectionEvent.ISectionSection[]>
      | undefined = revisionsMap.get(moduleIndex);
    if (!unitMap) {
      return sectionsForModule;
    }

    return sectionsForModule.map((sectionEvent, unitIndex) => {
      const revisedSections:
        | AutoBeAnalyzeWriteSectionEvent.ISectionSection[]
        | undefined = unitMap.get(unitIndex);
      if (revisedSections) {
        return { ...sectionEvent, sectionSections: revisedSections };
      }
      return sectionEvent;
    });
  });
}

/** Assemble all sections into final markdown content */
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
  for (
    let moduleIndex: number = 0;
    moduleIndex < moduleEvent.moduleSections.length;
    moduleIndex++
  ) {
    const moduleSection: AutoBeAnalyzeWriteModuleEvent.IModuleSection =
      moduleEvent.moduleSections[moduleIndex]!;
    const unitEvent: AutoBeAnalyzeWriteUnitEvent | undefined =
      unitEvents[moduleIndex];
    const sectionEventsForModule: AutoBeAnalyzeWriteSectionEvent[] | undefined =
      sectionResults[moduleIndex];

    // Module section header
    lines.push(`## ${moduleSection.title}`);
    lines.push("");
    if (moduleSection.content) {
      lines.push(moduleSection.content);
      lines.push("");
    }

    // For each unit section
    if (unitEvent) {
      for (
        let unitIndex: number = 0;
        unitIndex < unitEvent.unitSections.length;
        unitIndex++
      ) {
        const unitSection: AutoBeAnalyzeWriteUnitEvent.IUnitSection =
          unitEvent.unitSections[unitIndex]!;
        const sectionEvent: AutoBeAnalyzeWriteSectionEvent | undefined =
          sectionEventsForModule?.[unitIndex];

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
