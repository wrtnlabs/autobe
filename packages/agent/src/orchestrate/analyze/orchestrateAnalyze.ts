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
import {
  buildConstraintConsistencyReport,
  buildAttributeOwnershipReport,
  detectConstraintConflicts,
  buildFileConflictMap,
  detectAttributeDuplicates,
  buildFileAttributeDuplicateMap,
} from "./utils/buildConstraintConsistencyReport";
import {
  stripTocBridgeBlocks,
  detectEmptyBridgeBlocks,
} from "./utils/buildHardValidators";
import {
  buildAttributeRegistry,
  formatRegistryForPrompt,
} from "./utils/buildAttributeRegistry";

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
  sectionRetryCount?: number;
  sectionStagnationCount?: number;
  lastSectionContentSignature?: string;
  lastSectionRejectionSignature?: string;
}

const ANALYZE_SECTION_FILE_MAX_RETRY = 3;
const ANALYZE_SECTION_STAGNATION_MAX = 2;

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
    const validModuleFileResults = filterValidFileResults(
      reviewEvent.fileResults,
      props.fileStates.length,
      "Module review",
    );
    for (const fileResult of validModuleFileResults) {
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
    const validUnitFileResults = filterValidFileResults(
      reviewEvent.fileResults,
      props.fileStates.length,
      "Unit review",
    );
    for (const fileResult of validUnitFileResults) {
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
    const sectionFileBatches: number[][] = chunkSectionFileIndices(
      pendingArray,
      computeSectionBatchSize({
        attempt,
        pendingCount: pendingArray.length,
      }),
    );
    const promptCacheKey: string = v7();

    // Build Attribute Canonical Registry from approved files
    const approvedFiles = props.fileStates
      .filter((state, i) => !pendingIndices.has(i) && state.sectionResults)
      .map((state) => ({
        file: state.file,
        sectionEvents: state.sectionResults!,
      }));
    const attributeRegistry = formatRegistryForPrompt(
      buildAttributeRegistry({ files: approvedFiles }),
    );

    // Build scenario entity name list for invention validation (P0-B)
    const scenarioEntityNames = props.scenario.entities.map((e) => e.name);

    for (const sectionBatch of sectionFileBatches)
      await executeCachedBatch(
        ctx,
        sectionBatch.map((fileIndex) => async (cacheKey) => {
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
          const unitEvent: AutoBeAnalyzeWriteUnitEvent = unitResults[mi]!;
          for (
            let ui: number = 0;
            ui < unitEvent.unitSections.length;
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
                      attributeRegistry,
                      scenarioEntityNames,
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
                      scenarioEntityNames,
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

        // Auto-strip [DOWNSTREAM CONTEXT] blocks from TOC file
        if (state.file.filename === "00-toc.md") {
          stripTocBridgeBlocks(state.sectionResults);
        }

        return sectionResults;
        }),
        promptCacheKey,
      );

    // Pass 1: Per-file detailed review (parallel)
    const perFileReviewResults: Map<number, AutoBeAnalyzeSectionReviewEvent> =
      new Map();
    for (const sectionBatch of sectionFileBatches)
      await executeCachedBatch(
        ctx,
        sectionBatch.map((fileIndex) => async (cacheKey) => {
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
        progress: props.crossFileSectionReviewProgress,
        promptCacheKey,
        retry: attempt,
      });

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

    for (const fileIndex of pendingArray) {
      const state: IFileState = props.fileStates[fileIndex]!;
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
      const hasCriticalConflict =
        fileCriticalConflicts.length > 0 ||
        fileAttrDuplicates.length > 0 ||
        fileEmptyBridgeBlocks.length > 0;

      // Decision logic:
      // 1. per-file reject → reject (unchanged)
      // 2. per-file approve + critical conflict detected → reject (NEW: patch-first)
      // 3. per-file approve + no critical conflict → approve (unchanged)
      const approved = perFileApproved && !hasCriticalConflict;

      const structuredPerFileIssues = collectStructuredReviewIssues(
        perFileResult,
      );
      const structuredCrossFileIssues = collectStructuredReviewIssues(
        crossFileResult,
      );
      const programmaticIssues = buildProgrammaticSectionIssues({
        fileCriticalConflicts,
        fileAttrDuplicates,
        fileEmptyBridgeBlocks,
      });

      if (approved) {
        // Apply per-file revisions if provided
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
      } else {
        // Critical conflict rejected (per-file approved but programmatic violations exist)
        // Use cross-file rejectedModuleUnits for targeted patch if available
        state.sectionFeedback = formatStructuredIssuesForRetry({
          fallbackFeedback:
            `[Critical conflict] ${[
              ...fileCriticalConflicts,
              ...fileAttrDuplicates,
              ...fileEmptyBridgeBlocks,
            ].join("; ")}` +
            (crossFileResult?.feedback ? `\n${crossFileResult.feedback}` : ""),
          issues: [...programmaticIssues, ...structuredCrossFileIssues],
        });
        state.rejectedModuleUnits = normalizeRejectedModuleUnits(
          crossFileResult?.rejectedModuleUnits ?? null,
          [...programmaticIssues, ...structuredCrossFileIssues],
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
          throw new Error(
            `[orchestrateAnalyze] Section stage fail-fast (max retry exceeded: ${ANALYZE_SECTION_FILE_MAX_RETRY}) for file "${state.file.filename}"`,
          );
        }
        if (
          (state.sectionStagnationCount ?? 0) >= ANALYZE_SECTION_STAGNATION_MAX
        ) {
          throw new Error(
            `[orchestrateAnalyze] Section stage fail-fast (stagnation detected ${state.sectionStagnationCount}x) for file "${state.file.filename}"`,
          );
        }
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

function computeSectionBatchSize(props: {
  attempt: number;
  pendingCount: number;
}): number {
  if (props.pendingCount <= 2) return props.pendingCount;
  if (props.attempt <= 0) return Math.min(4, props.pendingCount);
  if (props.attempt === 1) return Math.min(2, props.pendingCount);
  return 1;
}

function chunkSectionFileIndices(
  indices: number[],
  size: number,
): number[][] {
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
      map.set(
        `${entry.moduleIndex}:${ui}`,
        formatRejectedModuleUnitFeedback(entry, ui),
      );
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
        rejectedModuleUnits?: AutoBeAnalyzeSectionReviewEvent.IRejectedModuleUnit[] | null;
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
          fixInstruction: group.feedback || result.feedback || "Fix review issues.",
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
  ];
}

function normalizeRejectedModuleUnits(
  rejected:
    | AutoBeAnalyzeSectionReviewEvent.IRejectedModuleUnit[]
    | null
    | undefined,
  fileIssues: AutoBeAnalyzeSectionReviewEvent.IReviewIssue[],
): AutoBeAnalyzeSectionReviewEvent.IRejectedModuleUnit[] | null {
  if (rejected == null) return null;
  return rejected.map((entry) => ({
    ...entry,
    issues:
      (entry.issues?.length ?? 0) > 0
        ? dedupeReviewIssues(entry.issues ?? [])
        : dedupeReviewIssues(
            fileIssues.filter(
              (issue) =>
                issue.moduleIndex === entry.moduleIndex &&
                (issue.unitIndex === null ||
                  entry.unitIndices.includes(issue.unitIndex)),
            ),
          ),
  }));
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
