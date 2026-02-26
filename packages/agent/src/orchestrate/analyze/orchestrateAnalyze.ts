import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeHistory,
  AutoBeAnalyzeModuleReviewEvent,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeSectionReviewEvent,
  AutoBeAnalyzeUnitReviewEvent,
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
import { orchestrateAnalyzeModuleReview } from "./orchestrateAnalyzeModuleReview";
import { orchestrateAnalyzeScenario } from "./orchestrateAnalyzeScenario";
import { orchestrateAnalyzeSectionCrossFileReview } from "./orchestrateAnalyzeSectionCrossFileReview";
import { orchestrateAnalyzeSectionReview } from "./orchestrateAnalyzeSectionReview";
import { orchestrateAnalyzeUnitReview } from "./orchestrateAnalyzeUnitReview";
import { orchestrateAnalyzeWriteModule } from "./orchestrateAnalyzeWriteModule";
import { orchestrateAnalyzeWriteSection } from "./orchestrateAnalyzeWriteSection";
import { orchestrateAnalyzeWriteSectionPatch } from "./orchestrateAnalyzeWriteSectionPatch";
import { orchestrateAnalyzeWriteUnit } from "./orchestrateAnalyzeWriteUnit";
import { orchestrateAnalyzeWriteUnitPatch } from "./orchestrateAnalyzeWriteUnitPatch";
import { AutoBeAnalyzeProgrammer } from "./programmers/AutoBeAnalyzeProgrammer";
import {
  buildAttributeRegistry,
  formatRegistryForPrompt,
} from "./utils/buildAttributeRegistry";
import {
  buildAttributeOwnershipReport,
  buildConstraintConsistencyReport,
  buildEnumConsistencyReport,
  buildFileAttributeDuplicateMap,
  buildFileConflictMap,
  buildFileEnumConflictMap,
  buildFilePermissionConflictMap,
  buildFileStateFieldConflictMap,
  detectAttributeDuplicates,
  detectConstraintConflicts,
  detectEnumConflicts,
  detectPermissionConflicts,
  detectStateFieldConflicts,
} from "./utils/buildConstraintConsistencyReport";
import {
  buildErrorCodeRegistry,
  buildFileErrorCodeConflictMap,
  detectErrorCodeConflicts,
  formatErrorCodeRegistryForPrompt,
} from "./utils/buildErrorCodeRegistry";
import {
  detectEmptyBridgeBlocks,
  detectOversizedToc,
  stripTocBridgeBlocks,
} from "./utils/buildHardValidators";
import {
  buildPermissionRegistry,
  formatPermissionRegistryForPrompt,
} from "./utils/buildPermissionRegistry";

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
  // Unit-stage partial regeneration tracking
  rejectedModuleIndicesForUnit?:
    | AutoBeAnalyzeUnitReviewEvent.IRejectedModule[]
    | null;
  unitStagnationCount?: number;
  lastUnitContentSignature?: string;
  lastUnitRejectionSignature?: string;
  // Section-stage partial regeneration tracking
  rejectedModuleUnits?:
    | AutoBeAnalyzeSectionReviewEvent.IRejectedModuleUnit[]
    | null;
  sectionRetryCount?: number;
  sectionReviewCount?: number;
  sectionStagnationCount?: number;
  lastSectionContentSignature?: string;
  lastSectionRejectionSignature?: string;
}

const ANALYZE_SECTION_FILE_MAX_RETRY = 5;
const ANALYZE_SECTION_FILE_MAX_REVIEW = 3;
const ANALYZE_SECTION_STAGNATION_MAX = 4;
const ANALYZE_UNIT_STAGNATION_MAX = 4;
const ANALYZE_DEBUG_LOG = process.env.AUTOBE_DEBUG_ANALYZE === "1";

const analyzeDebug = (message: string): void => {
  if (!ANALYZE_DEBUG_LOG) return;
  console.log(`[analyze-debug] ${new Date().toISOString()} ${message}`);
};

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
    analyzeDebug(
      `section attempt=${attempt} pending=${[...pendingIndices]
        .map((i) => props.fileStates[i]!.file.filename)
        .join(",")}`,
    );
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
    const validModuleFileResults = filterValidFileResults(
      reviewEvent.fileResults,
      props.fileStates.length,
      "Module review",
    );
    for (const fileResult of validModuleFileResults) {
      if (fileResult.approved) {
        // Apply revisions if provided
        const state: IFileState = props.fileStates[fileResult.fileIndex]!;
        state.moduleResult = AutoBeAnalyzeProgrammer.applyModuleRevisions(
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
 * Flow: Write units for pending files in parallel → Cross-file review all files
 * → Retry only rejected files (max 3 attempts).
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
    analyzeDebug(
      `unit attempt=${attempt} pending=${[...pendingIndices]
        .map((i) => props.fileStates[i]!.file.filename)
        .join(",")}`,
    );
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
        const moduleResult: AutoBeAnalyzeWriteModuleEvent = state.moduleResult!;
        analyzeDebug(
          `unit file-start attempt=${attempt} fileIndex=${fileIndex} file="${state.file.filename}"`,
        );

        // Build rejected module lookup for selective regeneration
        const rejectedSet: Set<number> | null = buildUnitRejectedSet(
          state.rejectedModuleIndicesForUnit,
        );
        const feedbackMap: Map<number, string> = buildUnitFeedbackMap(
          state.rejectedModuleIndicesForUnit,
        );

        // Increase write progress only for modules that will be regenerated
        for (
          let mi: number = 0;
          mi < moduleResult.moduleSections.length;
          mi++
        ) {
          if (isUnitRejected(rejectedSet, mi)) {
            props.unitWriteProgress.total++;
          }
        }

        // Write units, skipping approved ones on retry
        const unitResults: AutoBeAnalyzeWriteUnitEvent[] = [];
        for (
          let moduleIndex: number = 0;
          moduleIndex < moduleResult.moduleSections.length;
          moduleIndex++
        ) {
          if (isUnitRejected(rejectedSet, moduleIndex)) {
            // Regenerate this module's units with targeted feedback
            const targetedFeedback: string | undefined =
              feedbackMap.get(moduleIndex) ?? state.unitFeedback;
            const previousUnit: AutoBeAnalyzeWriteUnitEvent | undefined =
              state.unitResults?.[moduleIndex];

            const unitStart: number = Date.now();
            analyzeDebug(
              `unit module-start attempt=${attempt} fileIndex=${fileIndex} file="${state.file.filename}" moduleIndex=${moduleIndex} mode=${previousUnit && targetedFeedback?.trim() ? "patch" : "full"}`,
            );
            const unitEvent: AutoBeAnalyzeWriteUnitEvent =
              previousUnit && targetedFeedback?.trim()
                ? await orchestrateAnalyzeWriteUnitPatch(ctx, {
                    scenario: props.scenario,
                    file: state.file,
                    moduleEvent: moduleResult,
                    moduleIndex,
                    previousUnitEvent: previousUnit,
                    feedback: targetedFeedback,
                    progress: props.unitWriteProgress,
                    promptCacheKey: cacheKey,
                    retry: attempt,
                  })
                : await orchestrateAnalyzeWriteUnit(ctx, {
                    scenario: props.scenario,
                    file: state.file,
                    moduleEvent: moduleResult,
                    moduleIndex,
                    progress: props.unitWriteProgress,
                    promptCacheKey: cacheKey,
                    feedback: targetedFeedback,
                    retry: attempt,
                  });
            analyzeDebug(
              `unit module-done attempt=${attempt} fileIndex=${fileIndex} file="${state.file.filename}" moduleIndex=${moduleIndex} unitCount=${unitEvent.unitSections.length} elapsedMs=${Date.now() - unitStart}`,
            );
            unitResults.push(unitEvent);
          } else {
            // Keep existing approved module's unit result
            analyzeDebug(
              `unit module-skip attempt=${attempt} fileIndex=${fileIndex} file="${state.file.filename}" moduleIndex=${moduleIndex} (approved)`,
            );
            unitResults.push(state.unitResults![moduleIndex]!);
          }
        }
        state.unitResults = unitResults;
        analyzeDebug(
          `unit file-done attempt=${attempt} fileIndex=${fileIndex} file="${state.file.filename}"`,
        );
        return unitResults;
      }),
      promptCacheKey,
    );

    // Cross-file review all units
    analyzeDebug(`unit review-start attempt=${attempt}`);
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
    analyzeDebug(
      `unit review-done attempt=${attempt} results=${reviewEvent.fileResults.length}`,
    );

    // Process per-file results
    const validUnitFileResults = filterValidFileResults(
      reviewEvent.fileResults,
      props.fileStates.length,
      "Unit review",
    );
    for (const fileResult of validUnitFileResults) {
      if (fileResult.approved) {
        // Apply revisions if provided
        const state: IFileState = props.fileStates[fileResult.fileIndex]!;
        state.unitResults = AutoBeAnalyzeProgrammer.applyUnitRevisions(
          state.unitResults!,
          fileResult,
        );
        // Clear unit tracking state
        state.unitStagnationCount = 0;
        state.lastUnitContentSignature = undefined;
        state.lastUnitRejectionSignature = undefined;
        state.rejectedModuleIndicesForUnit = undefined;
        pendingIndices.delete(fileResult.fileIndex);
      } else {
        const state: IFileState = props.fileStates[fileResult.fileIndex]!;
        state.unitFeedback = fileResult.feedback;
        state.rejectedModuleIndicesForUnit = fileResult.rejectedModules ?? null;

        // Stagnation detection
        const contentSignature = buildUnitContentSignature(state);
        const rejectionSignature = buildUnitRejectionSignature({
          rejectedModuleIndicesForUnit: state.rejectedModuleIndicesForUnit,
          feedback: state.unitFeedback ?? "",
        });
        const isStagnant =
          state.lastUnitContentSignature === contentSignature &&
          state.lastUnitRejectionSignature === rejectionSignature;
        state.unitStagnationCount = isStagnant
          ? (state.unitStagnationCount ?? 0) + 1
          : 0;
        state.lastUnitContentSignature = contentSignature;
        state.lastUnitRejectionSignature = rejectionSignature;

        if ((state.unitStagnationCount ?? 0) >= ANALYZE_UNIT_STAGNATION_MAX) {
          throw new Error(
            `[orchestrateAnalyze] Unit stage fail-fast (stagnation detected ${state.unitStagnationCount}x) for file "${state.file.filename}"`,
          );
        }
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
 *
 * 1. Write sections for pending files in parallel
 * 2. Pass 1: Per-file detailed review (parallel) — validates EARS format, value
 *    consistency, bridge blocks, intra-file deduplication
 * 3. Pass 2: Cross-file lightweight review (single call) — validates terminology
 *    alignment, value consistency across files, naming conventions
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
  let crossFileReviewCount: number = 0;

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
    const sectionFileBatches: number[][] = chunkSectionFileIndices(
      pendingArray,
      computeSectionBatchSize({
        attempt,
        pendingCount: pendingArray.length,
      }),
    );
    const promptCacheKey: string = v7();

    // Build Canonical Registries from approved files
    const approvedFiles = props.fileStates
      .filter((state, i) => !pendingIndices.has(i) && state.sectionResults)
      .map((state) => ({
        file: state.file,
        sectionEvents: state.sectionResults!,
      }));
    const attributeRegistry = formatRegistryForPrompt(
      buildAttributeRegistry({ files: approvedFiles }),
    );
    const permissionRegistry = formatPermissionRegistryForPrompt(
      buildPermissionRegistry({ files: approvedFiles }),
    );
    const errorCodeRegistry = formatErrorCodeRegistryForPrompt(
      buildErrorCodeRegistry({ files: approvedFiles }),
    );

    // Build scenario entity name list for invention validation (P0-B)
    const scenarioEntityNames = props.scenario.entities.map((e) => e.name);

    // Collect per-file review results (populated inside write+review batch)
    const perFileReviewResults: Map<number, AutoBeAnalyzeSectionReviewEvent> =
      new Map();

    for (const sectionBatch of sectionFileBatches)
      await executeCachedBatch(
        ctx,
        sectionBatch.map((fileIndex) => async (cacheKey) => {
          const state: IFileState = props.fileStates[fileIndex]!;
          const moduleResult: AutoBeAnalyzeWriteModuleEvent =
            state.moduleResult!;
          const unitResults: AutoBeAnalyzeWriteUnitEvent[] = state.unitResults!;
          analyzeDebug(
            `section file-start attempt=${attempt} fileIndex=${fileIndex} file="${state.file.filename}" batchSize=${sectionBatch.length}`,
          );

          // Build rejected module/unit lookup for selective regeneration
          const rejectedSet: Set<string> | null = buildRejectedSet(
            state.rejectedModuleUnits,
          );
          const feedbackMap: Map<string, ISectionAwareFeedback> =
            buildFeedbackMap(state.rejectedModuleUnits);

          // Increase write progress only for sections that will be regenerated
          for (let mi: number = 0; mi < unitResults.length; mi++) {
            const unitEvent: AutoBeAnalyzeWriteUnitEvent = unitResults[mi]!;
            for (let ui: number = 0; ui < unitEvent.unitSections.length; ui++) {
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
                const sectionStart: number = Date.now();
                // Regenerate this section with targeted feedback
                const targetedInfo: ISectionAwareFeedback | undefined =
                  feedbackMap.get(`${moduleIndex}:${unitIndex}`);
                const targetedFeedback: string | undefined =
                  targetedInfo?.feedback ?? state.sectionFeedback;
                const targetedSectionIndices: number[] | null =
                  targetedInfo?.sectionIndices ?? null;
                analyzeDebug(
                  `section unit-start attempt=${attempt} fileIndex=${fileIndex} file="${state.file.filename}" moduleIndex=${moduleIndex} unitIndex=${unitIndex} targetSections=${targetedSectionIndices ? `[${targetedSectionIndices.join(",")}]` : "all"}`,
                );
                const previousSection:
                  | AutoBeAnalyzeWriteSectionEvent
                  | undefined =
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
                        attributeRegistry,
                        permissionRegistry,
                        errorCodeRegistry,
                        scenarioEntityNames,
                        sectionIndices: targetedSectionIndices,
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
                        attributeRegistry,
                        permissionRegistry,
                        errorCodeRegistry,
                        scenarioEntityNames,
                      });
                analyzeDebug(
                  `section unit-done attempt=${attempt} fileIndex=${fileIndex} file="${state.file.filename}" moduleIndex=${moduleIndex} unitIndex=${unitIndex} sectionCount=${sectionEvent.sectionSections.length} elapsedMs=${Date.now() - sectionStart}`,
                );
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

          // Auto-strip [DOWNSTREAM CONTEXT] blocks from TOC file
          if (state.file.filename === "00-toc.md") {
            stripTocBridgeBlocks(state.sectionResults);
          }
          analyzeDebug(
            `section file-write-done attempt=${attempt} fileIndex=${fileIndex} file="${state.file.filename}"`,
          );

          // Per-file review immediately after write (removes barrier)
          const reviewStart: number = Date.now();
          analyzeDebug(
            `section per-file-review-start attempt=${attempt} fileIndex=${fileIndex} file="${state.file.filename}"`,
          );
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
          analyzeDebug(
            `section per-file-review-done attempt=${attempt} fileIndex=${fileIndex} file="${state.file.filename}" elapsedMs=${Date.now() - reviewStart}`,
          );
          perFileReviewResults.set(fileIndex, reviewEvent);

          return sectionResults;
        }),
        promptCacheKey,
      );

    // Pass 2: Cross-file lightweight review (single call)
    crossFileReviewCount++;
    if (crossFileReviewCount > ANALYZE_SECTION_FILE_MAX_REVIEW) {
      analyzeDebug(
        `[orchestrateAnalyze] Section stage: skipping cross-file review (max review ${ANALYZE_SECTION_FILE_MAX_REVIEW} exceeded)`,
      );
      // Force-pass all pending files
      for (const fileIndex of pendingArray) pendingIndices.delete(fileIndex);
      break;
    }
    analyzeDebug(`section cross-file-review-start attempt=${attempt}`);
    const filesWithSections = props.fileStates
      .filter((state) => state.sectionResults !== null)
      .map((state) => ({
        file: state.file,
        sectionEvents: state.sectionResults!,
      }));
    const constraintReport: string = buildConstraintConsistencyReport({
      files: filesWithSections,
    });
    const attributeOwnershipReport: string = buildAttributeOwnershipReport({
      files: filesWithSections,
    });
    const enumConsistencyReport: string = buildEnumConsistencyReport({
      files: filesWithSections,
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
        attributeOwnershipReport,
        enumConsistencyReport,
        progress: props.crossFileSectionReviewProgress,
        promptCacheKey,
        retry: attempt,
      });
    analyzeDebug(
      `section cross-file-review-done attempt=${attempt} results=${crossFileReviewEvent.fileResults.length}`,
    );

    // Merge results from both passes
    const crossFileResultMap: Map<
      number,
      AutoBeAnalyzeSectionReviewEvent.IFileResult
    > = new Map();
    const validCrossFileResults = filterValidFileResults(
      crossFileReviewEvent.fileResults,
      props.fileStates.length,
      "Section cross-file review",
    );
    for (const fr of validCrossFileResults)
      crossFileResultMap.set(fr.fileIndex, fr);

    // Detect critical conflicts programmatically
    const criticalConflicts = detectConstraintConflicts({
      files: filesWithSections,
    });
    const fileConflictMap: Map<string, string[]> =
      buildFileConflictMap(criticalConflicts);

    // Detect cross-file attribute duplication programmatically
    const attributeDuplicates = detectAttributeDuplicates({
      files: filesWithSections,
    });
    const fileAttributeDuplicateMap: Map<string, string[]> =
      buildFileAttributeDuplicateMap(attributeDuplicates);

    // Detect empty Bridge Blocks programmatically
    const emptyBridgeBlockMap: Map<number, string[]> = new Map();
    for (const fileIndex of pendingArray) {
      const state = props.fileStates[fileIndex]!;
      if (state.sectionResults) {
        const violations = detectEmptyBridgeBlocks(state.sectionResults);
        if (violations.length > 0) {
          emptyBridgeBlockMap.set(
            fileIndex,
            violations.map((v) => v.detail),
          );
        }
      }
    }

    // Detect enum value conflicts programmatically
    const enumConflicts = detectEnumConflicts({
      files: filesWithSections,
    });
    const fileEnumConflictMap: Map<string, string[]> =
      buildFileEnumConflictMap(enumConflicts);

    // Detect permission rule conflicts programmatically
    const permissionConflicts = detectPermissionConflicts({
      files: filesWithSections,
    });
    const filePermissionConflictMap: Map<string, string[]> =
      buildFilePermissionConflictMap(permissionConflicts);

    // Detect state field conflicts programmatically
    const stateFieldConflicts = detectStateFieldConflicts({
      files: filesWithSections,
    });
    const fileStateFieldConflictMap: Map<string, string[]> =
      buildFileStateFieldConflictMap(stateFieldConflicts);

    // Detect error code conflicts programmatically
    const errorCodeConflicts = detectErrorCodeConflicts({
      files: filesWithSections,
    });
    const fileErrorCodeConflictMap: Map<string, string[]> =
      buildFileErrorCodeConflictMap(errorCodeConflicts);

    // Detect oversized TOC programmatically
    const oversizedTocMap: Map<number, string[]> = new Map();
    for (const fileIndex of pendingArray) {
      const state = props.fileStates[fileIndex]!;
      if (state.file.filename === "00-toc.md" && state.sectionResults) {
        const violations = detectOversizedToc(state.sectionResults);
        if (violations.length > 0) {
          oversizedTocMap.set(fileIndex, violations);
        }
      }
    }

    for (const fileIndex of pendingArray) {
      const state: IFileState = props.fileStates[fileIndex]!;

      // Increment review count and force-pass if exceeded limit
      state.sectionReviewCount = (state.sectionReviewCount ?? 0) + 1;
      if (state.sectionReviewCount > ANALYZE_SECTION_FILE_MAX_REVIEW) {
        analyzeDebug(
          `[orchestrateAnalyze] Section stage: force-passing (max review ${ANALYZE_SECTION_FILE_MAX_REVIEW} exceeded) for file "${state.file.filename}"`,
        );
        pendingIndices.delete(fileIndex);
        continue;
      }

      const perFileEvent = perFileReviewResults.get(fileIndex);
      const perFileResult = perFileEvent?.fileResults[0];
      const crossFileResult = crossFileResultMap.get(fileIndex);

      const perFileApproved = perFileResult?.approved ?? true;
      const crossFileApproved = crossFileResult?.approved ?? true;

      // Check if this file has programmatically-detected critical conflicts
      const filename = state.file.filename;
      const fileCriticalConflicts = fileConflictMap.get(filename) ?? [];
      const fileAttrDuplicates = fileAttributeDuplicateMap.get(filename) ?? [];
      const fileEmptyBridgeBlocks = emptyBridgeBlockMap.get(fileIndex) ?? [];
      const fileEnumConflicts = fileEnumConflictMap.get(filename) ?? [];
      const filePermissionConflicts =
        filePermissionConflictMap.get(filename) ?? [];
      const fileStateFieldConflicts =
        fileStateFieldConflictMap.get(filename) ?? [];
      const fileErrorCodeConflicts =
        fileErrorCodeConflictMap.get(filename) ?? [];
      const fileOversizedToc = oversizedTocMap.get(fileIndex) ?? [];
      const hasCriticalConflict =
        fileCriticalConflicts.length > 0 ||
        fileAttrDuplicates.length > 0 ||
        fileEmptyBridgeBlocks.length > 0 ||
        fileEnumConflicts.length > 0 ||
        filePermissionConflicts.length > 0 ||
        fileStateFieldConflicts.length > 0 ||
        fileErrorCodeConflicts.length > 0 ||
        fileOversizedToc.length > 0;

      // Decision logic:
      // 1. per-file reject → reject (unchanged)
      // 2. per-file approve + critical conflict detected → reject (NEW: patch-first)
      // 3. per-file approve + no critical conflict → approve (unchanged)
      const approved = perFileApproved && !hasCriticalConflict;

      const structuredPerFileIssues =
        collectStructuredReviewIssues(perFileResult);
      const structuredCrossFileIssues =
        collectStructuredReviewIssues(crossFileResult);
      const programmaticIssues = buildProgrammaticSectionIssues({
        fileCriticalConflicts,
        fileAttrDuplicates,
        fileEmptyBridgeBlocks,
        fileEnumConflicts,
        filePermissionConflicts,
        fileStateFieldConflicts,
        fileErrorCodeConflicts,
        fileOversizedToc,
      });

      if (approved) {
        // NOTE: revisedSections intentionally ignored — approved means pass as-is.
        // Applying revisedSections caused infinite re-write loops (sections kept growing).
        // Pass cross-file feedback as advisory for next retry's context
        if (!crossFileApproved && crossFileResult?.feedback) {
          state.sectionFeedback = `[Cross-file advisory] ${crossFileResult.feedback}`;
        }
        state.sectionRetryCount = 0;
        state.sectionStagnationCount = 0;
        state.lastSectionContentSignature = undefined;
        state.lastSectionRejectionSignature = undefined;
        pendingIndices.delete(fileIndex);
      } else if (!perFileApproved) {
        // Per-file rejected: store only the latest per-file feedback (no accumulation)
        state.sectionFeedback = formatStructuredIssuesForRetry({
          fallbackFeedback: perFileResult?.feedback ?? "",
          issues: structuredPerFileIssues,
        });

        // Use only per-file rejectedModuleUnits (no cross-file merge)
        state.rejectedModuleUnits = normalizeRejectedModuleUnits(
          perFileResult?.rejectedModuleUnits ?? null,
          structuredPerFileIssues,
        );
        // Fallback: infer targets from issues to avoid full-file rewrite
        if (state.rejectedModuleUnits === null) {
          state.rejectedModuleUnits = inferRejectedModuleUnitsFromIssues(
            structuredPerFileIssues,
            state.unitResults!,
          );
        }
        analyzeDebug(
          `section reject file="${state.file.filename}" attempt=${attempt} perFileApproved=${perFileApproved} crossFileApproved=${crossFileApproved} critical=${hasCriticalConflict} targets=${formatRejectedModuleUnitsSummary(
            state.rejectedModuleUnits,
          )} issues=${formatReviewIssuesSummary(structuredPerFileIssues)} feedback=${truncateForDebug(
            state.sectionFeedback ?? "",
            500,
          )}`,
        );
      } else {
        // Critical conflict rejected (per-file approved but programmatic violations exist)
        // Use cross-file rejectedModuleUnits for targeted patch if available
        state.sectionFeedback = formatStructuredIssuesForRetry({
          fallbackFeedback:
            `[Critical conflict] ${[
              ...fileCriticalConflicts,
              ...fileAttrDuplicates,
              ...fileEmptyBridgeBlocks,
              ...fileEnumConflicts,
            ].join("; ")}` +
            (crossFileResult?.feedback ? `\n${crossFileResult.feedback}` : ""),
          issues: [...programmaticIssues, ...structuredCrossFileIssues],
        });
        state.rejectedModuleUnits = normalizeRejectedModuleUnits(
          crossFileResult?.rejectedModuleUnits ?? null,
          [...programmaticIssues, ...structuredCrossFileIssues],
        );
        // Fallback: infer targets from issues to avoid full-file rewrite
        if (state.rejectedModuleUnits === null) {
          state.rejectedModuleUnits = inferRejectedModuleUnitsFromIssues(
            [...programmaticIssues, ...structuredCrossFileIssues],
            state.unitResults!,
          );
        }
        analyzeDebug(
          `section reject file="${state.file.filename}" attempt=${attempt} perFileApproved=${perFileApproved} crossFileApproved=${crossFileApproved} critical=${hasCriticalConflict} targets=${formatRejectedModuleUnitsSummary(
            state.rejectedModuleUnits,
          )} issues=${formatReviewIssuesSummary([
            ...programmaticIssues,
            ...structuredCrossFileIssues,
          ])} feedback=${truncateForDebug(state.sectionFeedback ?? "", 500)}`,
        );
      }

      if (!approved) {
        const contentSignature = buildSectionContentSignature(state);
        const rejectionSignature = buildSectionRejectionSignature({
          rejectedModuleUnits: state.rejectedModuleUnits ?? null,
          feedback: state.sectionFeedback ?? "",
        });
        const isStagnant =
          state.lastSectionContentSignature === contentSignature &&
          state.lastSectionRejectionSignature === rejectionSignature;
        state.sectionStagnationCount = isStagnant
          ? (state.sectionStagnationCount ?? 0) + 1
          : 0;
        state.sectionRetryCount = (state.sectionRetryCount ?? 0) + 1;
        state.lastSectionContentSignature = contentSignature;
        state.lastSectionRejectionSignature = rejectionSignature;

        if ((state.sectionRetryCount ?? 0) > ANALYZE_SECTION_FILE_MAX_RETRY) {
          analyzeDebug(
            `[orchestrateAnalyze] Section stage: force-passing (max retry exceeded: ${ANALYZE_SECTION_FILE_MAX_RETRY}) for file "${state.file.filename}"`,
          );
          pendingIndices.delete(fileIndex);
          continue;
        }
        if (
          (state.sectionStagnationCount ?? 0) >= ANALYZE_SECTION_STAGNATION_MAX
        ) {
          analyzeDebug(
            `[orchestrateAnalyze] Section stage: force-passing (stagnation detected ${state.sectionStagnationCount}x) for file "${state.file.filename}"`,
          );
          pendingIndices.delete(fileIndex);
          continue;
        }
      }
    }
  }

  if (pendingIndices.size > 0) {
    analyzeDebug(
      `[orchestrateAnalyze] Section stage: force-passing after max retries for files: ${[
        ...pendingIndices,
      ]
        .map((i) => props.fileStates[i]!.file.filename)
        .join(", ")}`,
    );
  }
}

// ─── Section-stage helper functions ───

function computeSectionBatchSize(props: {
  attempt: number;
  pendingCount: number;
}): number {
  return Math.min(8, props.pendingCount);
}

function chunkSectionFileIndices(indices: number[], size: number): number[][] {
  if (indices.length === 0) return [];
  if (size <= 0 || size >= indices.length) return [indices];
  const chunks: number[][] = [];
  for (let i = 0; i < indices.length; i += size)
    chunks.push(indices.slice(i, i + size));
  return chunks;
}

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

interface ISectionAwareFeedback {
  feedback: string;
  sectionIndices: number[] | null;
}

function buildFeedbackMap(
  rejected:
    | AutoBeAnalyzeSectionReviewEvent.IRejectedModuleUnit[]
    | null
    | undefined,
): Map<string, ISectionAwareFeedback> {
  const map: Map<string, ISectionAwareFeedback> = new Map();
  if (rejected == null) return map;
  for (const entry of rejected) {
    for (const ui of entry.unitIndices) {
      map.set(`${entry.moduleIndex}:${ui}`, {
        feedback: formatRejectedModuleUnitFeedback(entry, ui),
        sectionIndices: entry.sectionIndicesPerUnit?.[ui] ?? null,
      });
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

function filterValidFileResults<T extends { fileIndex: number }>(
  fileResults: T[],
  fileCount: number,
  stage: string,
): T[] {
  return fileResults.filter((fr) => {
    if (
      Number.isInteger(fr.fileIndex) &&
      fr.fileIndex >= 0 &&
      fr.fileIndex < fileCount
    ) {
      return true;
    }
    console.warn(
      `[orchestrateAnalyze] ${stage}: invalid fileIndex ${fr.fileIndex} (valid: 0-${fileCount - 1})`,
    );
    return false;
  });
}

function formatRejectedModuleUnitFeedback(
  entry: AutoBeAnalyzeSectionReviewEvent.IRejectedModuleUnit,
  unitIndex: number,
): string {
  const scopedIssues = (entry.issues ?? []).filter(
    (issue) =>
      issue.moduleIndex === entry.moduleIndex &&
      (issue.unitIndex === null || issue.unitIndex === unitIndex),
  );
  if (scopedIssues.length === 0) return entry.feedback;
  return [
    entry.feedback,
    ...scopedIssues.map(
      (issue) =>
        `- [${issue.ruleCode}] target=${formatIssueTarget(issue)} fix=${issue.fixInstruction}`,
    ),
  ].join("\n");
}

function collectStructuredReviewIssues(
  result:
    | {
        feedback: string;
        rejectedModuleUnits?:
          | AutoBeAnalyzeSectionReviewEvent.IRejectedModuleUnit[]
          | null;
        issues?: AutoBeAnalyzeSectionReviewEvent.IReviewIssue[] | null;
      }
    | undefined,
): AutoBeAnalyzeSectionReviewEvent.IReviewIssue[] {
  if (!result) return [];
  const collected: AutoBeAnalyzeSectionReviewEvent.IReviewIssue[] = [];

  for (const issue of result.issues ?? []) collected.push(issue);
  for (const group of result.rejectedModuleUnits ?? []) {
    for (const issue of group.issues ?? []) collected.push(issue);
    if ((group.issues?.length ?? 0) === 0) {
      for (const unitIndex of group.unitIndices) {
        collected.push({
          ruleCode: "section_review_reject",
          moduleIndex: group.moduleIndex,
          unitIndex,
          fixInstruction:
            group.feedback || result.feedback || "Fix review issues.",
          evidence: null,
        });
      }
    }
  }

  if (collected.length === 0 && result.feedback.trim().length > 0) {
    collected.push({
      ruleCode: "section_review_reject",
      moduleIndex: null,
      unitIndex: null,
      fixInstruction: result.feedback,
      evidence: null,
    });
  }
  return dedupeReviewIssues(collected);
}

function buildProgrammaticSectionIssues(props: {
  fileCriticalConflicts: string[];
  fileAttrDuplicates: string[];
  fileEmptyBridgeBlocks: string[];
  fileEnumConflicts: string[];
  filePermissionConflicts: string[];
  fileStateFieldConflicts: string[];
  fileErrorCodeConflicts: string[];
  fileOversizedToc: string[];
}): AutoBeAnalyzeSectionReviewEvent.IReviewIssue[] {
  return [
    ...props.fileCriticalConflicts.map((detail) => ({
      ruleCode: "cross_file_constraint_conflict",
      moduleIndex: null,
      unitIndex: null,
      fixInstruction:
        "Align conflicting constraints/values with other files and preserve one canonical value.",
      evidence: detail,
    })),
    ...props.fileAttrDuplicates.map((detail) => ({
      ruleCode: "cross_file_attribute_duplicate",
      moduleIndex: null,
      unitIndex: null,
      fixInstruction:
        "Remove duplicate attribute specifications across files and keep ownership in one file.",
      evidence: detail,
    })),
    ...props.fileEmptyBridgeBlocks.map((detail) => ({
      ruleCode: "empty_bridge_block",
      moduleIndex: null,
      unitIndex: null,
      fixInstruction:
        "Fill [DOWNSTREAM CONTEXT] Bridge Block with concrete entities, attributes, operations, permissions, and errors.",
      evidence: detail,
    })),
    ...props.fileEnumConflicts.map((detail) => ({
      ruleCode: "cross_file_enum_conflict",
      moduleIndex: null,
      unitIndex: null,
      fixInstruction:
        "Align enum values with the canonical definition from the first file that specified this attribute. Use the exact same enum set.",
      evidence: detail,
    })),
    ...props.filePermissionConflicts.map((detail) => ({
      ruleCode: "cross_file_permission_conflict",
      moduleIndex: null,
      unitIndex: null,
      fixInstruction:
        "Align permission rules with the canonical definition. If the first file says 'denied', all files must say 'denied' for the same actor→operation.",
      evidence: detail,
    })),
    ...props.fileStateFieldConflicts.map((detail) => ({
      ruleCode: "cross_file_state_field_conflict",
      moduleIndex: null,
      unitIndex: null,
      fixInstruction:
        "Use ONE canonical approach for state fields. If other files use 'deletedAt: datetime', do NOT use 'isDeleted: boolean'. Pick one and align.",
      evidence: detail,
    })),
    ...props.fileErrorCodeConflicts.map((detail) => ({
      ruleCode: "cross_file_error_code_conflict",
      moduleIndex: null,
      unitIndex: null,
      fixInstruction:
        "Use the canonical error code defined in the first file. Do NOT invent alternative error codes for the same condition.",
      evidence: detail,
    })),
    ...props.fileOversizedToc.map((detail) => ({
      ruleCode: "oversized_toc",
      moduleIndex: null,
      unitIndex: null,
      fixInstruction:
        "TOC must be a concise navigation aid. Remove detailed requirements, keep only navigation tables and brief summaries.",
      evidence: detail,
    })),
  ];
}

function buildSectionIndicesPerUnit(
  issues: AutoBeAnalyzeSectionReviewEvent.IReviewIssue[],
  moduleIndex: number,
  unitIndices: number[],
): Record<number, number[]> | null {
  const map: Record<number, Set<number>> = {};
  let hasSectionLevel = false;

  for (const issue of issues) {
    if (
      issue.moduleIndex === moduleIndex &&
      issue.unitIndex !== null &&
      unitIndices.includes(issue.unitIndex) &&
      issue.sectionIndex !== null &&
      issue.sectionIndex !== undefined &&
      Number.isInteger(issue.sectionIndex) &&
      issue.sectionIndex >= 0
    ) {
      if (!map[issue.unitIndex]) map[issue.unitIndex] = new Set();
      map[issue.unitIndex]!.add(issue.sectionIndex);
      hasSectionLevel = true;
    }
  }

  if (!hasSectionLevel) return null;

  const result: Record<number, number[]> = {};
  for (const [ui, sectionSet] of Object.entries(map)) {
    result[Number(ui)] = [...sectionSet].sort((a, b) => a - b);
  }
  return result;
}

function normalizeRejectedModuleUnits(
  rejected:
    | AutoBeAnalyzeSectionReviewEvent.IRejectedModuleUnit[]
    | null
    | undefined,
  fileIssues: AutoBeAnalyzeSectionReviewEvent.IReviewIssue[],
): AutoBeAnalyzeSectionReviewEvent.IRejectedModuleUnit[] | null {
  if (rejected == null) return null;
  return rejected.map((entry) => {
    const enrichedIssues =
      (entry.issues?.length ?? 0) > 0
        ? dedupeReviewIssues(entry.issues ?? [])
        : dedupeReviewIssues(
            fileIssues.filter(
              (issue) =>
                issue.moduleIndex === entry.moduleIndex &&
                (issue.unitIndex === null ||
                  entry.unitIndices.includes(issue.unitIndex)),
            ),
          );

    const sectionIndicesPerUnit =
      entry.sectionIndicesPerUnit ??
      buildSectionIndicesPerUnit(
        enrichedIssues,
        entry.moduleIndex,
        entry.unitIndices,
      );

    return {
      ...entry,
      issues: enrichedIssues,
      sectionIndicesPerUnit,
    };
  });
}

/**
 * Infer rejectedModuleUnits from structured issues when the LLM review didn't
 * provide explicit rejection targets. This prevents full-file rewrites when
 * only specific module/unit pairs have issues.
 */
function inferRejectedModuleUnitsFromIssues(
  issues: AutoBeAnalyzeSectionReviewEvent.IReviewIssue[],
  unitResults: AutoBeAnalyzeWriteUnitEvent[],
): AutoBeAnalyzeSectionReviewEvent.IRejectedModuleUnit[] | null {
  const moduleUnitMap = new Map<number, Set<number>>();
  let hasTargetedIssue = false;

  for (const issue of issues) {
    if (issue.moduleIndex !== null && issue.moduleIndex !== undefined) {
      hasTargetedIssue = true;
      if (!moduleUnitMap.has(issue.moduleIndex)) {
        moduleUnitMap.set(issue.moduleIndex, new Set());
      }
      if (issue.unitIndex !== null && issue.unitIndex !== undefined) {
        moduleUnitMap.get(issue.moduleIndex)!.add(issue.unitIndex);
      }
    }
  }

  if (!hasTargetedIssue) return null;

  const result: AutoBeAnalyzeSectionReviewEvent.IRejectedModuleUnit[] = [];
  for (const [moduleIndex, unitIndexSet] of moduleUnitMap) {
    // If no specific units targeted, include all units for this module
    let unitIndices: number[];
    if (unitIndexSet.size === 0) {
      const unitEvent = unitResults[moduleIndex];
      unitIndices = unitEvent
        ? Array.from({ length: unitEvent.unitSections.length }, (_, i) => i)
        : [];
    } else {
      unitIndices = [...unitIndexSet].sort((a, b) => a - b);
    }

    const moduleIssues = dedupeReviewIssues(
      issues.filter(
        (i) =>
          i.moduleIndex === moduleIndex &&
          (i.unitIndex === null || unitIndices.includes(i.unitIndex)),
      ),
    );

    result.push({
      moduleIndex,
      unitIndices,
      feedback: moduleIssues.map((i) => i.fixInstruction).join("; "),
      issues: moduleIssues,
      sectionIndicesPerUnit: buildSectionIndicesPerUnit(
        moduleIssues,
        moduleIndex,
        unitIndices,
      ),
    });
  }

  return result.length > 0 ? result : null;
}

function formatStructuredIssuesForRetry(props: {
  fallbackFeedback: string;
  issues: AutoBeAnalyzeSectionReviewEvent.IReviewIssue[];
}): string {
  if (props.issues.length === 0) return props.fallbackFeedback;
  const lines = props.issues.map(
    (issue) =>
      `- [${issue.ruleCode}] target=${formatIssueTarget(issue)} fix=${issue.fixInstruction}` +
      (issue.evidence ? ` | evidence=${issue.evidence}` : ""),
  );
  return `${props.fallbackFeedback}\n\n[STRUCTURED REVIEW ISSUES]\n${lines.join("\n")}`.trim();
}

function formatIssueTarget(
  issue: Pick<
    AutoBeAnalyzeSectionReviewEvent.IReviewIssue,
    "moduleIndex" | "unitIndex" | "sectionIndex"
  >,
): string {
  const parts: string[] = [];
  if (issue.moduleIndex !== null && issue.moduleIndex !== undefined)
    parts.push(`m${issue.moduleIndex}`);
  if (issue.unitIndex !== null && issue.unitIndex !== undefined)
    parts.push(`u${issue.unitIndex}`);
  if (issue.sectionIndex !== null && issue.sectionIndex !== undefined)
    parts.push(`s${issue.sectionIndex}`);
  return parts.length ? parts.join(".") : "file";
}

function dedupeReviewIssues(
  issues: AutoBeAnalyzeSectionReviewEvent.IReviewIssue[],
): AutoBeAnalyzeSectionReviewEvent.IReviewIssue[] {
  const map = new Map<string, AutoBeAnalyzeSectionReviewEvent.IReviewIssue>();
  for (const issue of issues) {
    const key = [
      issue.ruleCode,
      issue.moduleIndex ?? "x",
      issue.unitIndex ?? "x",
      issue.sectionIndex ?? "x",
      issue.fixInstruction,
    ].join("|");
    if (!map.has(key)) map.set(key, issue);
  }
  return [...map.values()];
}

// ─── Unit-stage partial regeneration helpers ───

function buildUnitRejectedSet(
  rejected: AutoBeAnalyzeUnitReviewEvent.IRejectedModule[] | null | undefined,
): Set<number> | null {
  if (rejected == null) return null;
  if (rejected.length === 0) return null;
  const set: Set<number> = new Set();
  for (const entry of rejected) {
    set.add(entry.moduleIndex);
  }
  return set.size > 0 ? set : null;
}

function buildUnitFeedbackMap(
  rejected: AutoBeAnalyzeUnitReviewEvent.IRejectedModule[] | null | undefined,
): Map<number, string> {
  const map: Map<number, string> = new Map();
  if (rejected == null) return map;
  for (const entry of rejected) {
    map.set(entry.moduleIndex, entry.feedback);
  }
  return map;
}

function isUnitRejected(
  rejectedSet: Set<number> | null,
  moduleIndex: number,
): boolean {
  if (rejectedSet === null) return true;
  return rejectedSet.has(moduleIndex);
}

function buildUnitContentSignature(state: IFileState): string {
  if (!state.unitResults) return "none";
  return JSON.stringify(
    state.unitResults.map((unitEvent) =>
      unitEvent.unitSections.map((section) => ({
        title: section.title,
        content: section.content,
        keywords: section.keywords,
      })),
    ),
  );
}

function buildUnitRejectionSignature(props: {
  rejectedModuleIndicesForUnit:
    | AutoBeAnalyzeUnitReviewEvent.IRejectedModule[]
    | null
    | undefined;
  feedback: string;
}): string {
  return JSON.stringify({
    rejectedModules: (props.rejectedModuleIndicesForUnit ?? []).map(
      (entry) => ({
        moduleIndex: entry.moduleIndex,
        feedback: entry.feedback,
      }),
    ),
    feedback: props.feedback,
  });
}

// ─── Section-stage helpers ───

function buildSectionContentSignature(state: IFileState): string {
  if (!state.sectionResults) return "none";
  return JSON.stringify(
    state.sectionResults.map((moduleSections) =>
      moduleSections.map((unit) =>
        unit.sectionSections.map((section) => ({
          title: section.title,
          // content text included to detect no-progress rewrites
          content: section.content,
        })),
      ),
    ),
  );
}

function buildSectionRejectionSignature(props: {
  rejectedModuleUnits:
    | AutoBeAnalyzeSectionReviewEvent.IRejectedModuleUnit[]
    | null
    | undefined;
  feedback: string;
}): string {
  return JSON.stringify({
    rejectedModuleUnits: (props.rejectedModuleUnits ?? []).map((entry) => ({
      moduleIndex: entry.moduleIndex,
      unitIndices: [...entry.unitIndices].sort((a, b) => a - b),
      feedback: entry.feedback,
      issues: (entry.issues ?? []).map((issue) => ({
        ruleCode: issue.ruleCode,
        moduleIndex: issue.moduleIndex,
        unitIndex: issue.unitIndex,
        sectionIndex: issue.sectionIndex ?? null,
        fixInstruction: issue.fixInstruction,
      })),
    })),
    feedback: props.feedback,
  });
}

function formatRejectedModuleUnitsSummary(
  rejected:
    | AutoBeAnalyzeSectionReviewEvent.IRejectedModuleUnit[]
    | null
    | undefined,
): string {
  if (!rejected || rejected.length === 0) return "all-or-unknown";
  return rejected
    .slice(0, 6)
    .map((entry) => {
      const unitParts = entry.unitIndices.map((ui) => {
        const sectionPart = entry.sectionIndicesPerUnit?.[ui];
        return sectionPart ? `u${ui}(s${sectionPart.join(",s")})` : `u${ui}`;
      });
      return `m${entry.moduleIndex}:${unitParts.join(",") || "-"}`;
    })
    .join(" | ");
}

function formatReviewIssuesSummary(
  issues: AutoBeAnalyzeSectionReviewEvent.IReviewIssue[],
): string {
  if (issues.length === 0) return "none";
  return issues
    .slice(0, 8)
    .map((issue) => `${issue.ruleCode}@${formatIssueTarget(issue)}`)
    .join(", ");
}

function truncateForDebug(text: string, max: number): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  if (singleLine.length <= max) return singleLine;
  return `${singleLine.slice(0, max)}...`;
}
