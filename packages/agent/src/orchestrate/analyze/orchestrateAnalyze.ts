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
import { orchestrateAnalyzeWriteSectionPatch } from "./orchestrateAnalyzeWriteSectionPatch";
import { orchestrateAnalyzeWriteUnit } from "./orchestrateAnalyzeWriteUnit";
import { AutoBeAnalyzeProgrammer } from "./programmers/AutoBeAnalyzeProgrammer";
import { buildConstraintConsistencyReport } from "./utils/buildConstraintConsistencyReport";

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
  rejectedModuleUnits?:
    | AutoBeAnalyzeSectionReviewEvent.IRejectedModuleUnit[]
    | null;
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

        // Build rejected module/unit lookup for selective regeneration
        const rejectedSet: Set<string> | null = buildRejectedSet(
          state.rejectedModuleUnits,
        );
        const feedbackMap: Map<string, string> = buildFeedbackMap(
          state.rejectedModuleUnits,
        );

        // Increase write progress only for sections that will be regenerated
        for (
          let mi: number = 0;
          mi < unitResults.length;
          mi++
        ) {
          const ue: AutoBeAnalyzeWriteUnitEvent = unitResults[mi]!;
          for (
            let ui: number = 0;
            ui < ue.unitSections.length;
            ui++
          ) {
            if (isSectionRejected(rejectedSet, mi, ui)) {
              props.sectionWriteProgress.total++;
            }
          }
        }

        // Write sections, skipping approved ones on retry
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
            if (isSectionRejected(rejectedSet, moduleIndex, unitIndex)) {
              // Regenerate this section with targeted feedback
              const targetedFeedback: string | undefined =
                feedbackMap.get(`${moduleIndex}:${unitIndex}`) ??
                state.sectionFeedback;
              const previousSection: AutoBeAnalyzeWriteSectionEvent | undefined =
                state.sectionResults?.[moduleIndex]?.[unitIndex];
              const sectionEvent: AutoBeAnalyzeWriteSectionEvent =
                previousSection && targetedFeedback?.trim()
                  ? await orchestrateAnalyzeWriteSectionPatch(ctx, {
                      scenario: props.scenario,
                      file: state.file,
                      moduleEvent: moduleResult,
                      unitEvent,
                      moduleIndex,
                      unitIndex,
                      previousSectionEvent: previousSection,
                      feedback: targetedFeedback,
                      progress: props.sectionWriteProgress,
                      promptCacheKey: cacheKey,
                      retry: attempt,
                    })
                  : await orchestrateAnalyzeWriteSection(ctx, {
                      scenario: props.scenario,
                      file: state.file,
                      moduleEvent: moduleResult,
                      unitEvent,
                      allUnitEvents: unitResults,
                      moduleIndex,
                      unitIndex,
                      progress: props.sectionWriteProgress,
                      promptCacheKey: cacheKey,
                      feedback: targetedFeedback,
                      retry: attempt,
                    });
              sectionsForModule.push(sectionEvent);
            } else {
              // Keep existing approved section
              sectionsForModule.push(
                state.sectionResults![moduleIndex]![unitIndex]!,
              );
            }
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
    const constraintReport: string = buildConstraintConsistencyReport({
      files: props.fileStates
        .filter((state) => state.sectionResults !== null)
        .map((state) => ({
          file: state.file,
          sectionEvents: state.sectionResults!,
        })),
    });
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
        constraintReport,
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

      // Cross-file review is advisory-only: approve based on per-file only
      const approved = perFileApproved;

      if (approved) {
        // Apply per-file revisions if provided
        const state: IFileState = props.fileStates[fileIndex]!;
        if (perFileResult?.revisedSections) {
          state.sectionResults = AutoBeAnalyzeProgrammer.applySectionRevisions(
            state.sectionResults!,
            perFileResult,
          );
        }
        // Pass cross-file feedback as advisory for next retry's context
        if (!crossFileApproved && crossFileResult?.feedback) {
          state.sectionFeedback =
            `[Cross-file advisory] ${crossFileResult.feedback}`;
        }
        pendingIndices.delete(fileIndex);
      } else {
        // Per-file rejected: store only the latest per-file feedback (no accumulation)
        props.fileStates[fileIndex]!.sectionFeedback =
          perFileResult?.feedback ?? "";

        // Use only per-file rejectedModuleUnits (no cross-file merge)
        props.fileStates[fileIndex]!.rejectedModuleUnits =
          perFileResult?.rejectedModuleUnits ?? null;
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

// ─── Section-stage helper functions ───

function buildRejectedSet(
  rejected:
    | AutoBeAnalyzeSectionReviewEvent.IRejectedModuleUnit[]
    | null
    | undefined,
): Set<string> | null {
  if (rejected == null) return null;
  if (rejected.length === 0) return null;
  const set: Set<string> = new Set();
  for (const entry of rejected) {
    for (const ui of entry.unitIndices) {
      set.add(`${entry.moduleIndex}:${ui}`);
    }
  }
  return set.size > 0 ? set : null;
}

function buildFeedbackMap(
  rejected:
    | AutoBeAnalyzeSectionReviewEvent.IRejectedModuleUnit[]
    | null
    | undefined,
): Map<string, string> {
  const map: Map<string, string> = new Map();
  if (rejected == null) return map;
  for (const entry of rejected) {
    for (const ui of entry.unitIndices) {
      map.set(`${entry.moduleIndex}:${ui}`, entry.feedback);
    }
  }
  return map;
}

function isSectionRejected(
  rejectedSet: Set<string> | null,
  moduleIndex: number,
  unitIndex: number,
): boolean {
  if (rejectedSet === null) return true;
  return rejectedSet.has(`${moduleIndex}:${unitIndex}`);
}

