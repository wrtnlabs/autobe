import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeHistory,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeModuleReviewEvent,
  AutoBeAnalyzeUnitReviewEvent,
  AutoBeAnalyzeSectionReviewEvent,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteUnitEvent,
  AutoBeAssistantMessageHistory,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { orchestrateAnalyzeScenario } from "./orchestrateAnalyzeScenario";
import { orchestrateAnalyzeModuleReview } from "./orchestrateAnalyzeModuleReview";
import { orchestrateAnalyzeUnitReview } from "./orchestrateAnalyzeUnitReview";
import { orchestrateAnalyzeSectionCrossFileReview } from "./orchestrateAnalyzeSectionCrossFileReview";
import { orchestrateAnalyzeSectionReview } from "./orchestrateAnalyzeSectionReview";
import { orchestrateAnalyzeWriteModule } from "./orchestrateAnalyzeWriteModule";
import { orchestrateAnalyzeWriteSection } from "./orchestrateAnalyzeWriteSection";
import { orchestrateAnalyzeWriteUnit } from "./orchestrateAnalyzeWriteUnit";
import { AutoBeAnalyzeProgrammer } from "./programmers/AutoBeAnalyzeProgrammer";

/**
 * Per-file state tracking across all three stages (Module → Unit → Section).
 *
 * Maintains each file's intermediate results and cross-file review feedback
 * throughout the stage-synchronized pipeline.
 */
interface IFileState {
  file: AutoBeAnalyzeFile.Scenario;
  moduleResult: AutoBeAnalyzeWriteModuleEvent | null;
  unitResults: AutoBeAnalyzeWriteUnitEvent[] | null;
  sectionResults: AutoBeAnalyzeWriteSectionEvent[][] | null;
  moduleFeedback?: string;
  unitFeedback?: string;
  sectionFeedback?: string;
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

  // Initialize per-file state
  const fileStates: IFileState[] = scenario.files.map((file) => ({
    file,
    moduleResult: null,
    unitResults: null,
    sectionResults: null,
  }));

  // Progress tracking for each stage
  const moduleWriteProgress: AutoBeProgressEventBase = {
    total: scenario.files.length,
    completed: 0,
  };
  const crossFileModuleReviewProgress: AutoBeProgressEventBase = {
    total: 1,
    completed: 0,
  };
  const unitWriteProgress: AutoBeProgressEventBase = {
    total: 0,
    completed: 0,
  };
  const crossFileUnitReviewProgress: AutoBeProgressEventBase = {
    total: 1,
    completed: 0,
  };
  const sectionWriteProgress: AutoBeProgressEventBase = {
    total: 0,
    completed: 0,
  };
  const perFileSectionReviewProgress: AutoBeProgressEventBase = {
    total: scenario.files.length,
    completed: 0,
  };
  const crossFileSectionReviewProgress: AutoBeProgressEventBase = {
    total: 1,
    completed: 0,
  };

  // === STAGE 1: MODULE (all files synchronized) ===
  await processStageModule(ctx, {
    scenario,
    fileStates,
    moduleWriteProgress,
    crossFileModuleReviewProgress,
  });

  // === STAGE 2: UNIT (all files synchronized) ===
  await processStageUnit(ctx, {
    scenario,
    fileStates,
    unitWriteProgress,
    crossFileUnitReviewProgress,
  });

  // === STAGE 3: SECTION (all files synchronized) ===
  await processStageSection(ctx, {
    scenario,
    fileStates,
    sectionWriteProgress,
    perFileSectionReviewProgress,
    crossFileSectionReviewProgress,
  });

  // === ASSEMBLE ===
  const files: AutoBeAnalyzeFile[] = fileStates.map((state) => ({
    ...state.file,
    content: AutoBeAnalyzeProgrammer.assembleContent(
      state.moduleResult!,
      state.unitResults!,
      state.sectionResults!,
    ),
    module: AutoBeAnalyzeProgrammer.assembleModule(
      state.moduleResult!,
      state.unitResults!,
      state.sectionResults!,
    ),
  }));

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

// MODULE

/**
 * Process the Module stage for all files with cross-file review.
 *
 * Flow: Write modules for pending files in parallel → Cross-file review all
 * files → Retry only rejected files (max 3 attempts).
 */
async function processStageModule(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    fileStates: IFileState[];
    moduleWriteProgress: AutoBeProgressEventBase;
    crossFileModuleReviewProgress: AutoBeProgressEventBase;
  },
): Promise<void> {
  const pendingIndices: Set<number> = new Set(
    props.fileStates.map((_, i) => i),
  );

  for (
    let attempt: number = 0;
    attempt < AutoBeConfigConstant.ANALYZE_RETRY && pendingIndices.size > 0;
    attempt++
  ) {
    // Dynamically increase progress for retries
    if (attempt > 0) {
      props.moduleWriteProgress.total += pendingIndices.size;
      props.crossFileModuleReviewProgress.total++;
    }

    // Write modules for pending files in parallel
    const pendingArray: number[] = [...pendingIndices];
    const promptCacheKey: string = v7();
    await executeCachedBatch(
      ctx,
      pendingArray.map((fileIndex) => async (cacheKey) => {
        const state: IFileState = props.fileStates[fileIndex]!;
        state.moduleResult = await orchestrateAnalyzeWriteModule(ctx, {
          scenario: props.scenario,
          file: state.file,
          progress: props.moduleWriteProgress,
          promptCacheKey: cacheKey,
          feedback: state.moduleFeedback,
          retry: attempt,
        });
        return state.moduleResult;
      }),
      promptCacheKey,
    );

    // Cross-file review all modules
    const reviewEvent: AutoBeAnalyzeModuleReviewEvent =
      await orchestrateAnalyzeModuleReview(ctx, {
        scenario: props.scenario,
        allFileModules: props.fileStates.map((state, fileIndex) => ({
          file: state.file,
          moduleEvent: state.moduleResult!,
          status: pendingIndices.has(fileIndex)
            ? attempt === 0
              ? "new"
              : "rewritten"
            : "approved",
        })),
        progress: props.crossFileModuleReviewProgress,
        promptCacheKey,
        retry: attempt,
      });

    // Process per-file results
    for (const fileResult of reviewEvent.fileResults) {
      if (fileResult.approved) {
        // Apply revisions if provided
        const state: IFileState = props.fileStates[fileResult.fileIndex]!;
        state.moduleResult =
          AutoBeAnalyzeProgrammer.applyModuleRevisions(
            state.moduleResult!,
            fileResult,
          );
        pendingIndices.delete(fileResult.fileIndex);
      } else {
        props.fileStates[fileResult.fileIndex]!.moduleFeedback =
          fileResult.feedback;
      }
    }
  }

  if (pendingIndices.size > 0) {
    throw new Error(
      "[orchestrateAnalyze] Module stage failed after max retries for files: " +
        [...pendingIndices]
          .map((i) => props.fileStates[i]!.file.filename)
          .join(", "),
    );
  }
}

// UNIT

/**
 * Process the Unit stage for all files with cross-file review.
 *
 * Flow: Write units for pending files in parallel → Cross-file review all
 * files → Retry only rejected files (max 3 attempts).
 */
async function processStageUnit(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    fileStates: IFileState[];
    unitWriteProgress: AutoBeProgressEventBase;
    crossFileUnitReviewProgress: AutoBeProgressEventBase;
  },
): Promise<void> {
  const pendingIndices: Set<number> = new Set(
    props.fileStates.map((_, i) => i),
  );

  for (
    let attempt: number = 0;
    attempt < AutoBeConfigConstant.ANALYZE_RETRY && pendingIndices.size > 0;
    attempt++
  ) {
    // Dynamically increase review progress for retries
    if (attempt > 0) {
      props.crossFileUnitReviewProgress.total++;
    }

    // Write units for pending files in parallel
    const pendingArray: number[] = [...pendingIndices];
    const promptCacheKey: string = v7();

    await executeCachedBatch(
      ctx,
      pendingArray.map((fileIndex) => async (cacheKey) => {
        const state: IFileState = props.fileStates[fileIndex]!;
        const moduleResult: AutoBeAnalyzeWriteModuleEvent =
          state.moduleResult!;

        // Increase write progress for this file's units
        props.unitWriteProgress.total += moduleResult.moduleSections.length;

        // Write all units for this file sequentially
        const unitResults: AutoBeAnalyzeWriteUnitEvent[] = [];
        for (
          let moduleIndex: number = 0;
          moduleIndex < moduleResult.moduleSections.length;
          moduleIndex++
        ) {
          const unitEvent: AutoBeAnalyzeWriteUnitEvent =
            await orchestrateAnalyzeWriteUnit(ctx, {
              scenario: props.scenario,
              file: state.file,
              moduleEvent: moduleResult,
              moduleIndex,
              progress: props.unitWriteProgress,
              promptCacheKey: cacheKey,
              feedback: state.unitFeedback,
              retry: attempt,
            });
          unitResults.push(unitEvent);
        }
        state.unitResults = unitResults;
        return unitResults;
      }),
      promptCacheKey,
    );

    // Cross-file review all units
    const reviewEvent: AutoBeAnalyzeUnitReviewEvent =
      await orchestrateAnalyzeUnitReview(ctx, {
        scenario: props.scenario,
        allFileUnits: props.fileStates.map((state, fileIndex) => ({
          file: state.file,
          moduleEvent: state.moduleResult!,
          unitEvents: state.unitResults!,
          status: pendingIndices.has(fileIndex)
            ? attempt === 0
              ? "new"
              : "rewritten"
            : "approved",
        })),
        progress: props.crossFileUnitReviewProgress,
        promptCacheKey,
        retry: attempt,
      });

    // Process per-file results
    for (const fileResult of reviewEvent.fileResults) {
      if (fileResult.approved) {
        // Apply revisions if provided
        const state: IFileState = props.fileStates[fileResult.fileIndex]!;
        state.unitResults =
          AutoBeAnalyzeProgrammer.applyUnitRevisions(
            state.unitResults!,
            fileResult,
          );
        pendingIndices.delete(fileResult.fileIndex);
      } else {
        props.fileStates[fileResult.fileIndex]!.unitFeedback =
          fileResult.feedback;
      }
    }
  }

  if (pendingIndices.size > 0) {
    throw new Error(
      "[orchestrateAnalyze] Unit stage failed after max retries for files: " +
        [...pendingIndices]
          .map((i) => props.fileStates[i]!.file.filename)
          .join(", "),
    );
  }
}

// SECTION

/**
 * Process the Section stage for all files with 2-pass review.
 *
 * Flow:
 * 1. Write sections for pending files in parallel
 * 2. Pass 1: Per-file detailed review (parallel) — validates EARS format,
 *    value consistency, bridge blocks, intra-file deduplication
 * 3. Pass 2: Cross-file lightweight review (single call) — validates
 *    terminology alignment, value consistency across files, naming conventions
 * 4. Merge results from both passes — reject if either pass rejects
 * 5. Retry only rejected files (max 3 attempts)
 */
async function processStageSection(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    fileStates: IFileState[];
    sectionWriteProgress: AutoBeProgressEventBase;
    perFileSectionReviewProgress: AutoBeProgressEventBase;
    crossFileSectionReviewProgress: AutoBeProgressEventBase;
  },
): Promise<void> {
  const pendingIndices: Set<number> = new Set(
    props.fileStates.map((_, i) => i),
  );

  for (
    let attempt: number = 0;
    attempt < AutoBeConfigConstant.ANALYZE_RETRY && pendingIndices.size > 0;
    attempt++
  ) {
    // Dynamically increase progress for retries
    if (attempt > 0) {
      props.perFileSectionReviewProgress.total += pendingIndices.size;
      props.crossFileSectionReviewProgress.total++;
    }

    // Write sections for pending files in parallel
    const pendingArray: number[] = [...pendingIndices];
    const promptCacheKey: string = v7();

    await executeCachedBatch(
      ctx,
      pendingArray.map((fileIndex) => async (cacheKey) => {
        const state: IFileState = props.fileStates[fileIndex]!;
        const moduleResult: AutoBeAnalyzeWriteModuleEvent =
          state.moduleResult!;
        const unitResults: AutoBeAnalyzeWriteUnitEvent[] = state.unitResults!;

        // Increase write progress for this file's sections
        props.sectionWriteProgress.total += unitResults.reduce(
          (sum, u) => sum + u.unitSections.length,
          0,
        );

        // Write all sections for this file
        const sectionResults: AutoBeAnalyzeWriteSectionEvent[][] = [];
        for (
          let moduleIndex: number = 0;
          moduleIndex < unitResults.length;
          moduleIndex++
        ) {
          const unitEvent: AutoBeAnalyzeWriteUnitEvent =
            unitResults[moduleIndex]!;
          const sectionsForModule: AutoBeAnalyzeWriteSectionEvent[] = [];

          for (
            let unitIndex: number = 0;
            unitIndex < unitEvent.unitSections.length;
            unitIndex++
          ) {
            const sectionEvent: AutoBeAnalyzeWriteSectionEvent =
              await orchestrateAnalyzeWriteSection(ctx, {
                scenario: props.scenario,
                file: state.file,
                moduleEvent: moduleResult,
                unitEvent,
                moduleIndex,
                unitIndex,
                progress: props.sectionWriteProgress,
                promptCacheKey: cacheKey,
                feedback: state.sectionFeedback,
                retry: attempt,
              });
            sectionsForModule.push(sectionEvent);
          }
          sectionResults.push(sectionsForModule);
        }
        state.sectionResults = sectionResults;
        return sectionResults;
      }),
      promptCacheKey,
    );

    // Pass 1: Per-file detailed review (parallel)
    const perFileReviewResults: Map<number, AutoBeAnalyzeSectionReviewEvent> =
      new Map();
    await executeCachedBatch(
      ctx,
      pendingArray.map((fileIndex) => async (cacheKey) => {
        const state: IFileState = props.fileStates[fileIndex]!;
        const reviewEvent: AutoBeAnalyzeSectionReviewEvent =
          await orchestrateAnalyzeSectionReview(ctx, {
            scenario: props.scenario,
            fileIndex,
            file: state.file,
            moduleEvent: state.moduleResult!,
            unitEvents: state.unitResults!,
            sectionEvents: state.sectionResults!,
            feedback: state.sectionFeedback,
            progress: props.perFileSectionReviewProgress,
            promptCacheKey: cacheKey,
            retry: attempt,
          });
        perFileReviewResults.set(fileIndex, reviewEvent);
        return reviewEvent;
      }),
      promptCacheKey,
    );

    // Pass 2: Cross-file lightweight review (single call)
    const crossFileReviewEvent: AutoBeAnalyzeSectionReviewEvent =
      await orchestrateAnalyzeSectionCrossFileReview(ctx, {
        scenario: props.scenario,
        allFileSummaries: props.fileStates.map((state, fileIndex) => ({
          file: state.file,
          moduleEvent: state.moduleResult!,
          unitEvents: state.unitResults!,
          sectionEvents: state.sectionResults!,
          status: pendingIndices.has(fileIndex)
            ? attempt === 0
              ? "new"
              : "rewritten"
            : "approved",
        })),
        progress: props.crossFileSectionReviewProgress,
        promptCacheKey,
        retry: attempt,
      });

    // Merge results from both passes
    const crossFileResultMap: Map<
      number,
      AutoBeAnalyzeSectionReviewEvent.IFileResult
    > = new Map();
    for (const fr of crossFileReviewEvent.fileResults)
      crossFileResultMap.set(fr.fileIndex, fr);

    for (const fileIndex of pendingArray) {
      const perFileEvent = perFileReviewResults.get(fileIndex);
      const perFileResult = perFileEvent?.fileResults[0];
      const crossFileResult = crossFileResultMap.get(fileIndex);

      const perFileApproved = perFileResult?.approved ?? true;
      const crossFileApproved = crossFileResult?.approved ?? true;
      const approved = perFileApproved && crossFileApproved;

      if (approved) {
        // Apply per-file revisions if provided
        const state: IFileState = props.fileStates[fileIndex]!;
        if (perFileResult?.revisedSections) {
          state.sectionResults = AutoBeAnalyzeProgrammer.applySectionRevisions(
            state.sectionResults!,
            perFileResult,
          );
        }
        pendingIndices.delete(fileIndex);
      } else {
        // Combine feedback from both passes
        const feedbackParts: string[] = [];
        if (!perFileApproved && perFileResult?.feedback)
          feedbackParts.push(
            `[Per-file review] ${perFileResult.feedback}`,
          );
        if (!crossFileApproved && crossFileResult?.feedback)
          feedbackParts.push(
            `[Cross-file review] ${crossFileResult.feedback}`,
          );
        props.fileStates[fileIndex]!.sectionFeedback =
          feedbackParts.join("\n\n");
      }
    }
  }

  if (pendingIndices.size > 0) {
    throw new Error(
      "[orchestrateAnalyze] Section stage failed after max retries for files: " +
        [...pendingIndices]
          .map((i) => props.fileStates[i]!.file.filename)
          .join(", "),
    );
  }
}
