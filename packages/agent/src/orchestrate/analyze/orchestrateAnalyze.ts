import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeHistory,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeWriteMajorEvent,
  AutoBeAnalyzeWriteMajorReviewEvent,
  AutoBeAnalyzeWriteMiddleEvent,
  AutoBeAnalyzeWriteMiddleReviewEvent,
  AutoBeAnalyzeWriteMinorEvent,
  AutoBeAnalyzeWriteMinorReviewEvent,
  AutoBeAssistantMessageHistory,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { orchestrateAnalyzeScenario } from "./orchestrateAnalyzeScenario";
import { orchestrateAnalyzeWriteMajor } from "./orchestrateAnalyzeWriteMajor";
import { orchestrateAnalyzeWriteMajorReview } from "./orchestrateAnalyzeWriteMajorReview";
import { orchestrateAnalyzeWriteMiddle } from "./orchestrateAnalyzeWriteMiddle";
import { orchestrateAnalyzeWriteMiddleReview } from "./orchestrateAnalyzeWriteMiddleReview";
import { orchestrateAnalyzeWriteMinor } from "./orchestrateAnalyzeWriteMinor";
import { orchestrateAnalyzeWriteMinorReview } from "./orchestrateAnalyzeWriteMinorReview";

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
 * Process a single file through the hierarchical Major → Middle → Minor flow
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
  // Step 1: Major Write → Review
  const majorResult = await writeAndReviewMajor(ctx, props);

  // Step 2: For each major section, do Middle Write → Review
  const middleResults: AutoBeAnalyzeWriteMiddleEvent[] = [];
  for (let majorIndex = 0; majorIndex < majorResult.majorSections.length; majorIndex++) {
    const middleResult = await writeAndReviewMiddle(ctx, {
      ...props,
      majorEvent: majorResult,
      majorIndex,
    });
    middleResults.push(middleResult);
  }

  // Step 3: For each middle section, do Minor Write → Review
  const minorResults: AutoBeAnalyzeWriteMinorEvent[][] = [];
  for (let majorIndex = 0; majorIndex < middleResults.length; majorIndex++) {
    const middleEvent = middleResults[majorIndex]!;
    const minorForMajor: AutoBeAnalyzeWriteMinorEvent[] = [];

    for (let middleIndex = 0; middleIndex < middleEvent.middleSections.length; middleIndex++) {
      const minorResult = await writeAndReviewMinor(ctx, {
        ...props,
        majorEvent: majorResult,
        middleEvent,
        majorIndex,
        middleIndex,
      });
      minorForMajor.push(minorResult);
    }
    minorResults.push(minorForMajor);
  }

  // Step 4: Assemble final content
  return assembleContent(majorResult, middleResults, minorResults);
}

/**
 * Write Major sections with review and retry on failure
 */
async function writeAndReviewMajor(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeAnalyzeWriteMajorEvent> {
  let feedback: string | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const majorEvent = await orchestrateAnalyzeWriteMajor(ctx, {
      scenario: props.scenario,
      file: props.file,
      progress: props.progress,
      feedback,
      promptCacheKey: props.promptCacheKey,
    });

    const reviewEvent: AutoBeAnalyzeWriteMajorReviewEvent =
      await orchestrateAnalyzeWriteMajorReview(ctx, {
        scenario: props.scenario,
        file: props.file,
        majorEvent,
        progress: props.progress,
        promptCacheKey: props.promptCacheKey,
      });

    if (reviewEvent.approved) {
      // Apply revisions if provided
      return applyMajorRevisions(majorEvent, reviewEvent);
    }

    feedback = reviewEvent.feedback;
  }

  throw new Error("[orchestrateAnalyze] Major write failed after max retries");
}

/**
 * Write Middle sections with review and retry on failure
 */
async function writeAndReviewMiddle(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    majorEvent: AutoBeAnalyzeWriteMajorEvent;
    majorIndex: number;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeAnalyzeWriteMiddleEvent> {
  let feedback: string | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const middleEvent = await orchestrateAnalyzeWriteMiddle(ctx, {
      scenario: props.scenario,
      file: props.file,
      majorEvent: props.majorEvent,
      majorIndex: props.majorIndex,
      progress: props.progress,
      feedback,
      promptCacheKey: props.promptCacheKey,
    });

    const reviewEvent: AutoBeAnalyzeWriteMiddleReviewEvent =
      await orchestrateAnalyzeWriteMiddleReview(ctx, {
        scenario: props.scenario,
        file: props.file,
        majorEvent: props.majorEvent,
        middleEvent,
        progress: props.progress,
        promptCacheKey: props.promptCacheKey,
      });

    if (reviewEvent.approved) {
      // Apply revisions if provided
      return applyMiddleRevisions(middleEvent, reviewEvent);
    }

    feedback = reviewEvent.feedback;
  }

  throw new Error("[orchestrateAnalyze] Middle write failed after max retries");
}

/**
 * Write Minor sections with review and retry on failure
 */
async function writeAndReviewMinor(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    file: AutoBeAnalyzeFile.Scenario;
    majorEvent: AutoBeAnalyzeWriteMajorEvent;
    middleEvent: AutoBeAnalyzeWriteMiddleEvent;
    majorIndex: number;
    middleIndex: number;
    progress: AutoBeProgressEventBase;
    promptCacheKey: string;
  },
): Promise<AutoBeAnalyzeWriteMinorEvent> {
  let feedback: string | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const minorEvent = await orchestrateAnalyzeWriteMinor(ctx, {
      scenario: props.scenario,
      file: props.file,
      majorEvent: props.majorEvent,
      middleEvent: props.middleEvent,
      majorIndex: props.majorIndex,
      middleIndex: props.middleIndex,
      progress: props.progress,
      feedback,
      promptCacheKey: props.promptCacheKey,
    });

    const reviewEvent: AutoBeAnalyzeWriteMinorReviewEvent =
      await orchestrateAnalyzeWriteMinorReview(ctx, {
        scenario: props.scenario,
        file: props.file,
        majorEvent: props.majorEvent,
        middleEvent: props.middleEvent,
        minorEvent,
        progress: props.progress,
        promptCacheKey: props.promptCacheKey,
      });

    if (reviewEvent.approved) {
      // Apply revisions if provided
      return applyMinorRevisions(minorEvent, reviewEvent);
    }

    feedback = reviewEvent.feedback;
  }

  throw new Error("[orchestrateAnalyze] Minor write failed after max retries");
}

/**
 * Apply major review revisions to the major event
 */
function applyMajorRevisions(
  majorEvent: AutoBeAnalyzeWriteMajorEvent,
  reviewEvent: AutoBeAnalyzeWriteMajorReviewEvent,
): AutoBeAnalyzeWriteMajorEvent {
  return {
    ...majorEvent,
    title: reviewEvent.revisedTitle ?? majorEvent.title,
    summary: reviewEvent.revisedSummary ?? majorEvent.summary,
    majorSections: reviewEvent.revisedSections ?? majorEvent.majorSections,
  };
}

/**
 * Apply middle review revisions to the middle event
 */
function applyMiddleRevisions(
  middleEvent: AutoBeAnalyzeWriteMiddleEvent,
  reviewEvent: AutoBeAnalyzeWriteMiddleReviewEvent,
): AutoBeAnalyzeWriteMiddleEvent {
  return {
    ...middleEvent,
    middleSections: reviewEvent.revisedSections ?? middleEvent.middleSections,
  };
}

/**
 * Apply minor review revisions to the minor event
 */
function applyMinorRevisions(
  minorEvent: AutoBeAnalyzeWriteMinorEvent,
  reviewEvent: AutoBeAnalyzeWriteMinorReviewEvent,
): AutoBeAnalyzeWriteMinorEvent {
  return {
    ...minorEvent,
    minorSections: reviewEvent.revisedSections ?? minorEvent.minorSections,
  };
}

/**
 * Assemble all sections into final markdown content
 */
function assembleContent(
  majorEvent: AutoBeAnalyzeWriteMajorEvent,
  middleEvents: AutoBeAnalyzeWriteMiddleEvent[],
  minorResults: AutoBeAnalyzeWriteMinorEvent[][],
): string {
  const lines: string[] = [];

  // Document title and summary
  lines.push(`# ${majorEvent.title}`);
  lines.push("");
  lines.push(majorEvent.summary);
  lines.push("");

  // For each major section
  for (let majorIndex = 0; majorIndex < majorEvent.majorSections.length; majorIndex++) {
    const majorSection = majorEvent.majorSections[majorIndex]!;
    const middleEvent = middleEvents[majorIndex];
    const minorEventsForMajor = minorResults[majorIndex];

    // Major section header
    lines.push(`## ${majorSection.title}`);
    lines.push("");
    if (majorSection.content) {
      lines.push(majorSection.content);
      lines.push("");
    }

    // For each middle section
    if (middleEvent) {
      for (let middleIndex = 0; middleIndex < middleEvent.middleSections.length; middleIndex++) {
        const middleSection = middleEvent.middleSections[middleIndex]!;
        const minorEvent = minorEventsForMajor?.[middleIndex];

        // Middle section header
        lines.push(`### ${middleSection.title}`);
        lines.push("");
        if (middleSection.content) {
          lines.push(middleSection.content);
          lines.push("");
        }

        // For each minor section
        if (minorEvent) {
          for (const minorSection of minorEvent.minorSections) {
            lines.push(`#### ${minorSection.title}`);
            lines.push("");
            lines.push(minorSection.content);
            lines.push("");
          }
        }
      }
    }
  }

  return lines.join("\n").trim();
}
