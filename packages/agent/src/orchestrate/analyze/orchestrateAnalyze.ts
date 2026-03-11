import { AgenticaValidationError } from "@agentica/core";
import {
  AutoBeAnalyzeFile,
  AutoBeAnalyzeFileScenario,
  AutoBeAnalyzeHistory,
  AutoBeAnalyzeScenarioEvent,
  AutoBeAnalyzeScenarioReviewEvent,
  AutoBeAnalyzeSectionReviewEvent,
  AutoBeAnalyzeSectionReviewFileResult,
  AutoBeAnalyzeSectionReviewIssue,
  AutoBeAnalyzeSectionReviewRejectedModuleUnit,
  AutoBeAnalyzeWriteModuleEvent,
  AutoBeAnalyzeWriteSectionEvent,
  AutoBeAnalyzeWriteUnitEvent,
  AutoBeAssistantMessageHistory,
  AutoBeProgressEventBase,
} from "@autobe/interface";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBePreliminaryExhaustedError } from "../../utils/AutoBePreliminaryExhaustedError";
import { AutoBeTimeoutError } from "../../utils/AutoBeTimeoutError";
import { executeCachedBatch } from "../../utils/executeCachedBatch";
import { fillTocDeterministic } from "./fillTocDeterministic";
import { orchestrateAnalyzeScenario } from "./orchestrateAnalyzeScenario";
import { orchestrateAnalyzeScenarioReview } from "./orchestrateAnalyzeScenarioReview";
import { orchestrateAnalyzeSectionCrossFileReview } from "./orchestrateAnalyzeSectionCrossFileReview";
import { orchestrateAnalyzeSectionReview } from "./orchestrateAnalyzeSectionReview";
import { orchestrateAnalyzeWriteSection } from "./orchestrateAnalyzeWriteSection";
import { orchestrateAnalyzeWriteSectionPatch } from "./orchestrateAnalyzeWriteSectionPatch";
import { orchestrateAnalyzeWriteUnit } from "./orchestrateAnalyzeWriteUnit";
import {
  assembleContent,
  assembleModule,
} from "./programmers/AutoBeAnalyzeProgrammer";
import {
  FixedAnalyzeTemplateFeature,
  FixedAnalyzeTemplateUnitTemplate,
  buildFixedAnalyzeExpandedTemplate,
  expandFixedAnalyzeTemplateUnits,
} from "./structures/FixedAnalyzeTemplate";
import {
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
  buildFileErrorCodeConflictMap,
  detectErrorCodeConflicts,
} from "./utils/buildErrorCodeRegistry";
import { detectOversizedToc } from "./utils/buildHardValidators";
import {
  buildFileProseConflictMap,
  detectProseConstraintConflicts,
} from "./utils/detectProseConstraintConflicts";
import { validateScenarioBasics } from "./utils/validateScenarioBasics";

/**
 * Per-file state tracking across all three stages (Module → Unit → Section).
 *
 * Maintains each file's intermediate results and cross-file review feedback
 * throughout the stage-synchronized pipeline.
 */
interface IFileState {
  file: AutoBeAnalyzeFileScenario;
  moduleResult: AutoBeAnalyzeWriteModuleEvent | null;
  unitResults: AutoBeAnalyzeWriteUnitEvent[] | null;
  sectionResults: AutoBeAnalyzeWriteSectionEvent[][] | null;
  sectionFeedback?: string;
  // Section-stage partial regeneration tracking
  rejectedModuleUnits?: AutoBeAnalyzeSectionReviewRejectedModuleUnit[] | null;
  sectionRetryCount?: number;
  sectionReviewCount?: number;
  sectionStagnationCount?: number;
  lastSectionContentSignature?: string;
  lastSectionRejectionSignature?: string;
}

const ANALYZE_SCENARIO_MAX_RETRY = 2;
const ANALYZE_SECTION_FILE_MAX_RETRY = 5;
const ANALYZE_SECTION_FILE_MAX_REVIEW = 2;
const ANALYZE_SECTION_STAGNATION_MAX = 4;
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

  // Generate analysis scenario with pre-check + LLM review + retry loop
  let scenario!: AutoBeAnalyzeScenarioEvent;
  let scenarioFeedback: string | undefined;

  for (let attempt = 0; attempt <= ANALYZE_SCENARIO_MAX_RETRY; attempt++) {
    const rawScenario = await orchestrateAnalyzeScenario(ctx, {
      feedback: scenarioFeedback,
    });
    if (rawScenario.type === "assistantMessage")
      return ctx.assistantMessage(rawScenario);

    // 1) Programmatic pre-check
    const preCheck = validateScenarioBasics({
      prefix: rawScenario.prefix,
      actors: rawScenario.actors,
      entities: rawScenario.entities,
    });
    if (!preCheck.valid && attempt < ANALYZE_SCENARIO_MAX_RETRY) {
      analyzeDebug(
        `Scenario pre-check failed (attempt ${attempt}): ${preCheck.errors.join("; ")}`,
      );
      scenarioFeedback = `Programmatic validation failed:\n${preCheck.errors.join("\n")}`;
      continue;
    }

    // 2) LLM review
    let review: AutoBeAnalyzeScenarioReviewEvent;
    try {
      review = await orchestrateAnalyzeScenarioReview(ctx, {
        scenario: rawScenario,
        retry: attempt,
      });
    } catch (e) {
      if (
        e instanceof AgenticaValidationError ||
        e instanceof AutoBePreliminaryExhaustedError ||
        e instanceof AutoBeTimeoutError
      ) {
        analyzeDebug(
          `scenario review force-pass (attempt ${attempt}) error=${(e as Error).constructor.name}`,
        );
        review = {
          type: "analyzeScenarioReview",
          id: v7(),
          approved: true,
          feedback:
            "Review could not be completed; proceeding with current scenario.",
          issues: [],
          tokenUsage: {
            total: 0,
            input: { total: 0, cached: 0 },
            output: {
              total: 0,
              reasoning: 0,
              accepted_prediction: 0,
              rejected_prediction: 0,
            },
          },
          metric: {
            attempt: 0,
            success: 0,
            consent: 0,
            validationFailure: 0,
            invalidJson: 0,
          },
          step: (ctx.state().analyze?.step ?? -1) + 1,
          retry: attempt,
          created_at: new Date().toISOString(),
        };
      } else {
        throw e;
      }
    }

    if (review.approved || attempt >= ANALYZE_SCENARIO_MAX_RETRY) {
      analyzeDebug(
        review.approved
          ? `Scenario approved (attempt ${attempt})`
          : `Scenario max retry reached (attempt ${attempt}), proceeding`,
      );
      scenario = rawScenario;
      ctx.dispatch(scenario);
      break;
    }

    analyzeDebug(`Scenario rejected (attempt ${attempt}): ${review.feedback}`);
    scenarioFeedback = review.feedback;
  }

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
  const unitWriteProgress: AutoBeProgressEventBase = {
    total: 0,
    completed: 0,
  };
  const sectionWriteProgress: AutoBeProgressEventBase = {
    total: 0,
    completed: 0,
  };
  const perFileSectionReviewProgress: AutoBeProgressEventBase = {
    total: 0,
    completed: 0,
  };
  const crossFileSectionReviewProgress: AutoBeProgressEventBase = {
    total: 1,
    completed: 0,
  };

  // === STAGE 1: MODULE (deterministic — no LLM) ===
  processStageModuleDeterministic(ctx, {
    scenario,
    fileStates,
    moduleWriteProgress,
  });

  // === STAGE 2: UNIT (fixed units deterministic, dynamic units LLM) ===
  await processStageUnit(ctx, {
    scenario,
    fileStates,
    unitWriteProgress,
  });

  // === STAGE 3: SECTION (01-05 only, TOC excluded) ===
  await processStageSection(ctx, {
    scenario,
    fileStates,
    sectionWriteProgress,
    perFileSectionReviewProgress,
    crossFileSectionReviewProgress,
  });

  // === TOC FILL (deterministic — no LLM) ===
  const expandedTemplate = buildFixedAnalyzeExpandedTemplate(
    (scenario.features ?? []) as FixedAnalyzeTemplateFeature[],
  );
  const tocIndex = fileStates.findIndex((s) => s.file.filename === "00-toc.md");
  let tocContent: string | null = null;
  if (tocIndex >= 0) {
    tocContent = fillTocDeterministic(ctx, {
      scenario,
      tocFileState: fileStates[tocIndex]!,
      otherFileStates: fileStates.filter((_, i) => i !== tocIndex),
      expandedTemplate,
    });
  }

  // === ASSEMBLE ===
  const files: AutoBeAnalyzeFile[] = [];
  for (let fileIndex = 0; fileIndex < fileStates.length; fileIndex++) {
    const state = fileStates[fileIndex]!;
    // TOC uses flat content directly (no module/unit hierarchy)
    const content =
      fileIndex === tocIndex
        ? tocContent!
        : assembleContent(
            state.moduleResult!,
            state.unitResults!,
            state.sectionResults!,
          );
    const module = assembleModule(
      state.moduleResult!,
      state.unitResults!,
      state.sectionResults!,
    );

    files.push({
      ...state.file,
      title: state.moduleResult!.title,
      summary: state.moduleResult!.summary,
      content,
      module,
    });
  }

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

// MODULE (deterministic — no LLM calls)

/**
 * Generate module structure deterministically from FixedAnalyzeTemplate.
 *
 * No LLM calls needed — module titles, purposes, and structure are all derived
 * from the fixed 6-file SRS template.
 */
function processStageModuleDeterministic(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    fileStates: IFileState[];
    moduleWriteProgress: AutoBeProgressEventBase;
  },
): void {
  const expandedTemplate = buildFixedAnalyzeExpandedTemplate(
    (props.scenario.features ?? []) as FixedAnalyzeTemplateFeature[],
  );
  for (const [i, state] of props.fileStates.entries()) {
    const template = expandedTemplate[i]!;
    const moduleEvent: AutoBeAnalyzeWriteModuleEvent = {
      type: "analyzeWriteModule",
      id: v7(),
      title: `${props.scenario.prefix} — ${template.description}`,
      summary: template.description,
      moduleSections: template.modules.map((m) => ({
        title: m.title,
        purpose: m.purpose,
        content: m.purpose,
      })),
      step: (ctx.state().analyze?.step ?? -1) + 1,
      retry: 0,
      total: props.fileStates.length,
      completed: i + 1,
      tokenUsage: {
        total: 0,
        input: { total: 0, cached: 0 },
        output: {
          total: 0,
          reasoning: 0,
          accepted_prediction: 0,
          rejected_prediction: 0,
        },
      },
      metric: {
        attempt: 0,
        success: 0,
        consent: 0,
        validationFailure: 0,
        invalidJson: 0,
      },
      acquisition: { previousAnalysisSections: [] },
      created_at: new Date().toISOString(),
    };
    state.moduleResult = moduleEvent;
    ctx.dispatch(moduleEvent);
    props.moduleWriteProgress.completed++;
  }
}

// UNIT

/**
 * Process the Unit stage for all files.
 *
 * Fixed-strategy modules get deterministic unit generation (no LLM).
 * Dynamic-strategy modules (perEntity/perActor/perEntityGroup) use LLM. No
 * cross-file unit review — Hard Validators at section stage handle
 * consistency.
 */
async function processStageUnit(
  ctx: AutoBeContext,
  props: {
    scenario: AutoBeAnalyzeScenarioEvent;
    fileStates: IFileState[];
    unitWriteProgress: AutoBeProgressEventBase;
  },
): Promise<void> {
  const promptCacheKey: string = v7();
  const expandedTemplate = buildFixedAnalyzeExpandedTemplate(
    (props.scenario.features ?? []) as FixedAnalyzeTemplateFeature[],
  );

  // Count total units needed for progress tracking
  for (const [fileIndex, state] of props.fileStates.entries()) {
    const template = expandedTemplate[fileIndex]!;
    props.unitWriteProgress.total += template.modules.length;
    void state; // used below
  }

  await executeCachedBatch(
    ctx,
    props.fileStates.map((state, fileIndex) => async (cacheKey) => {
      // TOC is filled deterministically after all other files complete
      if (state.file.filename === "00-toc.md") return [];

      const moduleResult: AutoBeAnalyzeWriteModuleEvent = state.moduleResult!;
      const template = expandedTemplate[fileIndex]!;
      analyzeDebug(
        `unit file-start fileIndex=${fileIndex} file="${state.file.filename}"`,
      );

      const unitResults: AutoBeAnalyzeWriteUnitEvent[] = [];
      for (
        let moduleIndex: number = 0;
        moduleIndex < moduleResult.moduleSections.length;
        moduleIndex++
      ) {
        const moduleTemplate = template.modules[moduleIndex]!;
        const strategy = moduleTemplate.unitStrategy;

        if (strategy.type === "fixed") {
          // Deterministic unit generation — no LLM
          const unitEvent = buildDeterministicUnitEvent(ctx, {
            moduleIndex,
            units: strategy.units,
            progress: props.unitWriteProgress,
          });
          ctx.dispatch(unitEvent);
          unitResults.push(unitEvent);
        } else {
          // Dynamic units — expand from template, then LLM writes content+keywords
          const unitStart: number = Date.now();
          analyzeDebug(
            `unit module-start fileIndex=${fileIndex} file="${state.file.filename}" moduleIndex=${moduleIndex} strategy=${strategy.type}`,
          );
          try {
            const unitEvent: AutoBeAnalyzeWriteUnitEvent =
              await orchestrateAnalyzeWriteUnit(ctx, {
                scenario: props.scenario,
                file: state.file,
                moduleEvent: moduleResult,
                moduleIndex,
                progress: props.unitWriteProgress,
                promptCacheKey: cacheKey,
                retry: 0,
              });
            analyzeDebug(
              `unit module-done fileIndex=${fileIndex} file="${state.file.filename}" moduleIndex=${moduleIndex} unitCount=${unitEvent.unitSections.length} elapsedMs=${Date.now() - unitStart}`,
            );
            unitResults.push(unitEvent);
          } catch (e) {
            if (
              e instanceof AgenticaValidationError ||
              e instanceof AutoBePreliminaryExhaustedError ||
              e instanceof AutoBeTimeoutError
            ) {
              analyzeDebug(
                `unit module-skipped fileIndex=${fileIndex} file="${state.file.filename}" moduleIndex=${moduleIndex} error=${(e as Error).constructor.name} elapsedMs=${Date.now() - unitStart} — using fallback`,
              );
              const expandedUnits = expandFixedAnalyzeTemplateUnits(
                moduleTemplate,
                props.scenario.entities,
                props.scenario.actors,
              );
              const fallbackEvent = buildDeterministicUnitEvent(ctx, {
                moduleIndex,
                units: expandedUnits,
                progress: props.unitWriteProgress,
              });
              ctx.dispatch(fallbackEvent);
              unitResults.push(fallbackEvent);
            } else {
              throw e;
            }
          }
        }
      }
      state.unitResults = unitResults;
      analyzeDebug(
        `unit file-done fileIndex=${fileIndex} file="${state.file.filename}"`,
      );
      return unitResults;
    }),
    promptCacheKey,
  );
}

/** Build a deterministic AutoBeAnalyzeWriteUnitEvent for fixed-strategy modules. */
function buildDeterministicUnitEvent(
  ctx: AutoBeContext,
  props: {
    moduleIndex: number;
    units: FixedAnalyzeTemplateUnitTemplate[];
    progress: AutoBeProgressEventBase;
  },
): AutoBeAnalyzeWriteUnitEvent {
  props.progress.completed++;
  return {
    type: "analyzeWriteUnit",
    id: v7(),
    moduleIndex: props.moduleIndex,
    unitSections: props.units.map((u) => ({
      title: u.titlePattern,
      purpose: u.purposePattern,
      content: u.purposePattern,
      keywords: [...u.keywords],
    })),
    step: (ctx.state().analyze?.step ?? -1) + 1,
    retry: 0,
    total: props.progress.total,
    completed: props.progress.completed,
    tokenUsage: {
      total: 0,
      input: { total: 0, cached: 0 },
      output: {
        total: 0,
        reasoning: 0,
        accepted_prediction: 0,
        rejected_prediction: 0,
      },
    },
    metric: {
      attempt: 0,
      success: 0,
      consent: 0,
      validationFailure: 0,
      invalidJson: 0,
    },
    acquisition: { previousAnalysisSections: [] },
    created_at: new Date().toISOString(),
  };
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
  // Exclude TOC (00-toc.md) — it is filled deterministically after all files
  const pendingIndices: Set<number> = new Set(
    props.fileStates
      .map((s, i) => (s.file.filename === "00-toc.md" ? -1 : i))
      .filter((i) => i >= 0),
  );
  let crossFileReviewCount: number = 0;

  for (
    let attempt: number = 0;
    attempt < AutoBeConfigConstant.ANALYZE_RETRY && pendingIndices.size > 0;
    attempt++
  ) {
    // Dynamically increase progress for retries (module-level granularity)
    const pendingModuleCount = [...pendingIndices].reduce(
      (sum, fi) => sum + (props.fileStates[fi]?.unitResults?.length ?? 1),
      0,
    );
    props.perFileSectionReviewProgress.total += pendingModuleCount;
    if (attempt > 0) {
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
                let sectionEvent: AutoBeAnalyzeWriteSectionEvent;
                try {
                  sectionEvent =
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
                          scenarioEntityNames,
                        });
                } catch (e) {
                  if (
                    e instanceof AgenticaValidationError ||
                    e instanceof AutoBePreliminaryExhaustedError ||
                    e instanceof AutoBeTimeoutError
                  ) {
                    analyzeDebug(
                      `section unit-force-pass attempt=${attempt} fileIndex=${fileIndex} file="${state.file.filename}" moduleIndex=${moduleIndex} unitIndex=${unitIndex} error=${(e as Error).constructor.name} — ${previousSection ? "reusing previous" : "using placeholder"}`,
                    );
                    if (previousSection) {
                      sectionEvent = previousSection;
                    } else {
                      sectionEvent = {
                        type: "analyzeWriteSection",
                        id: v7(),
                        moduleIndex,
                        unitIndex,
                        sectionSections: [],
                        acquisition: { previousAnalysisSections: [] },
                        tokenUsage: {
                          total: 0,
                          input: { total: 0, cached: 0 },
                          output: {
                            total: 0,
                            reasoning: 0,
                            accepted_prediction: 0,
                            rejected_prediction: 0,
                          },
                        },
                        metric: {
                          attempt: 0,
                          success: 0,
                          consent: 0,
                          validationFailure: 0,
                          invalidJson: 0,
                        },
                        step: (ctx.state().analyze?.step ?? -1) + 1,
                        total: props.sectionWriteProgress.total,
                        completed: ++props.sectionWriteProgress.completed,
                        retry: attempt,
                        created_at: new Date().toISOString(),
                      };
                      ctx.dispatch(sectionEvent);
                    }
                  } else {
                    throw e;
                  }
                }
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

          analyzeDebug(
            `section file-write-done attempt=${attempt} fileIndex=${fileIndex} file="${state.file.filename}"`,
          );

          // Per-module review immediately after write (removes barrier)
          const reviewStart: number = Date.now();
          analyzeDebug(
            `section per-module-review-start attempt=${attempt} fileIndex=${fileIndex} file="${state.file.filename}" modules=${state.unitResults!.length}`,
          );
          const moduleReviews: AutoBeAnalyzeSectionReviewEvent[] = [];
          for (
            let moduleIndex = 0;
            moduleIndex < state.unitResults!.length;
            moduleIndex++
          ) {
            try {
              const moduleReviewEvent = await orchestrateAnalyzeSectionReview(
                ctx,
                {
                  scenario: props.scenario,
                  fileIndex,
                  file: state.file,
                  moduleEvent: state.moduleResult!,
                  moduleIndex,
                  unitEvent: state.unitResults![moduleIndex]!,
                  moduleSectionEvents: state.sectionResults![moduleIndex]!,
                  siblingModuleSummaries: buildSiblingModuleSummaries(
                    state.moduleResult!,
                    state.sectionResults!,
                    moduleIndex,
                  ),
                  feedback: state.sectionFeedback,
                  progress: props.perFileSectionReviewProgress,
                  promptCacheKey: cacheKey,
                  retry: attempt,
                },
              );
              moduleReviews.push(moduleReviewEvent);
            } catch (e) {
              if (
                e instanceof AgenticaValidationError ||
                e instanceof AutoBeTimeoutError ||
                e instanceof AutoBePreliminaryExhaustedError
              ) {
                analyzeDebug(
                  `section per-module-review-force-pass attempt=${attempt} fileIndex=${fileIndex} file="${state.file.filename}" moduleIndex=${moduleIndex} error=${(e as Error).constructor.name} — skipping this module review`,
                );
              } else {
                throw e;
              }
            }
          }
          const reviewEvent = mergeModuleReviewEvents(moduleReviews, fileIndex);
          analyzeDebug(
            `section per-module-review-done attempt=${attempt} fileIndex=${fileIndex} file="${state.file.filename}" modules=${moduleReviews.length} elapsedMs=${Date.now() - reviewStart}`,
          );
          perFileReviewResults.set(fileIndex, reviewEvent!);

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
    analyzeDebug(`section cross-file-validation-start attempt=${attempt}`);
    const filesWithSections = props.fileStates
      .filter((state) => state.sectionResults !== null)
      .map((state) => ({
        file: state.file,
        sectionEvents: state.sectionResults!,
      }));

    // Pass 2a: Programmatic cross-file validation (BEFORE LLM review)
    const criticalConflicts = detectConstraintConflicts({
      files: filesWithSections,
    });
    const fileConflictMap: Map<string, string[]> =
      buildFileConflictMap(criticalConflicts);

    const attributeDuplicates = detectAttributeDuplicates({
      files: filesWithSections,
    });
    const fileAttributeDuplicateMap: Map<string, string[]> =
      buildFileAttributeDuplicateMap(attributeDuplicates);

    const enumConflicts = detectEnumConflicts({
      files: filesWithSections,
    });
    const fileEnumConflictMap: Map<string, string[]> =
      buildFileEnumConflictMap(enumConflicts);

    const permissionConflicts = detectPermissionConflicts({
      files: filesWithSections,
    });
    const filePermissionConflictMap: Map<string, string[]> =
      buildFilePermissionConflictMap(permissionConflicts);

    const stateFieldConflicts = detectStateFieldConflicts({
      files: filesWithSections,
    });
    const fileStateFieldConflictMap: Map<string, string[]> =
      buildFileStateFieldConflictMap(stateFieldConflicts);

    const errorCodeConflicts = detectErrorCodeConflicts({
      files: filesWithSections,
    });
    const fileErrorCodeConflictMap: Map<string, string[]> =
      buildFileErrorCodeConflictMap(errorCodeConflicts);

    const proseConflicts = detectProseConstraintConflicts({
      files: filesWithSections,
    });
    const fileProseConflictMap: Map<string, string[]> =
      buildFileProseConflictMap(proseConflicts);

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

    // Build mechanical violation summary for LLM context
    const allMechanicalViolations: string[] = [
      ...criticalConflicts.map(
        (c) =>
          `Constraint conflict: ${c.key} — ${c.values.map((v) => `"${v.display}" in [${v.files.join(", ")}]`).join(" vs ")}`,
      ),
      ...attributeDuplicates.map(
        (d) => `Attribute duplication: ${d.key} in [${d.files.join(", ")}]`,
      ),
      ...enumConflicts.map(
        (c) =>
          `Enum conflict: ${c.key} — ${c.values.map((v) => `enum(${v.enumSet}) in [${v.files.join(", ")}]`).join(" vs ")}`,
      ),
      ...errorCodeConflicts.map(
        (c) =>
          `Error code conflict: ${c.conditionKey} — ${c.codes.map((cd) => `HTTP ${cd.httpStatus} in [${cd.files.join(", ")}]`).join(" vs ")}`,
      ),
      ...proseConflicts.map(
        (c) =>
          `Prose constraint conflict: ${c.entityAttr} — canonical [${c.canonicalValues.join(", ")}] vs prose [${c.proseValues.join(", ")}] in ${c.file}`,
      ),
    ];
    const mechanicalViolationSummary =
      allMechanicalViolations.length > 0
        ? allMechanicalViolations.join("\n")
        : undefined;

    // Pass 2b: Cross-file semantic LLM review (with mechanical violations excluded)
    analyzeDebug(`section cross-file-review-start attempt=${attempt}`);
    let crossFileReviewEvent: AutoBeAnalyzeSectionReviewEvent | null = null;
    try {
      crossFileReviewEvent = await orchestrateAnalyzeSectionCrossFileReview(
        ctx,
        {
          scenario: props.scenario,
          allFileSummaries: props.fileStates
            .filter((s) => s.file.filename !== "00-toc.md")
            .map((state) => {
              const fi = props.fileStates.indexOf(state);
              return {
                file: state.file,
                moduleEvent: state.moduleResult!,
                unitEvents: state.unitResults!,
                sectionEvents: state.sectionResults!,
                status: pendingIndices.has(fi)
                  ? attempt === 0
                    ? ("new" as const)
                    : ("rewritten" as const)
                  : ("approved" as const),
              };
            }),
          mechanicalViolationSummary,
          progress: props.crossFileSectionReviewProgress,
          promptCacheKey,
          retry: attempt,
        },
      );
    } catch (e) {
      if (
        e instanceof AgenticaValidationError ||
        e instanceof AutoBeTimeoutError ||
        e instanceof AutoBePreliminaryExhaustedError
      ) {
        analyzeDebug(
          `section cross-file-review-force-pass attempt=${attempt} error=${(e as Error).constructor.name} — force-passing all pending files`,
        );
        for (const fileIndex of pendingArray) pendingIndices.delete(fileIndex);
        break;
      }
      throw e;
    }
    analyzeDebug(
      `section cross-file-review-done attempt=${attempt} results=${crossFileReviewEvent.fileResults.length}`,
    );

    // Merge results from both passes
    const crossFileResultMap: Map<
      number,
      AutoBeAnalyzeSectionReviewFileResult
    > = new Map();
    const validCrossFileResults = filterValidFileResults(
      crossFileReviewEvent.fileResults,
      props.fileStates.length,
      "Section cross-file review",
    );
    for (const fr of validCrossFileResults)
      crossFileResultMap.set(fr.fileIndex, fr);

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
      const fileEnumConflicts = fileEnumConflictMap.get(filename) ?? [];
      const filePermissionConflicts =
        filePermissionConflictMap.get(filename) ?? [];
      const fileStateFieldConflicts =
        fileStateFieldConflictMap.get(filename) ?? [];
      const fileErrorCodeConflicts =
        fileErrorCodeConflictMap.get(filename) ?? [];
      const fileOversizedToc = oversizedTocMap.get(fileIndex) ?? [];
      const fileProseConflicts = fileProseConflictMap.get(filename) ?? [];
      const hasCriticalConflict =
        fileCriticalConflicts.length > 0 ||
        fileAttrDuplicates.length > 0 ||
        fileEnumConflicts.length > 0 ||
        filePermissionConflicts.length > 0 ||
        fileStateFieldConflicts.length > 0 ||
        fileErrorCodeConflicts.length > 0 ||
        fileOversizedToc.length > 0 ||
        fileProseConflicts.length > 0;

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
        fileEnumConflicts,
        filePermissionConflicts,
        fileStateFieldConflicts,
        fileErrorCodeConflicts,
        fileOversizedToc,
        fileProseConflicts,
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
              ...fileEnumConflicts,
              ...fileProseConflicts,
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
  rejected: AutoBeAnalyzeSectionReviewRejectedModuleUnit[] | null | undefined,
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
  rejected: AutoBeAnalyzeSectionReviewRejectedModuleUnit[] | null | undefined,
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
  entry: AutoBeAnalyzeSectionReviewRejectedModuleUnit,
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
          | AutoBeAnalyzeSectionReviewRejectedModuleUnit[]
          | null;
        issues?: AutoBeAnalyzeSectionReviewIssue[] | null;
      }
    | undefined,
): AutoBeAnalyzeSectionReviewIssue[] {
  if (!result) return [];
  const collected: AutoBeAnalyzeSectionReviewIssue[] = [];

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
  fileEnumConflicts: string[];
  filePermissionConflicts: string[];
  fileStateFieldConflicts: string[];
  fileErrorCodeConflicts: string[];
  fileOversizedToc: string[];
  fileProseConflicts: string[];
}): AutoBeAnalyzeSectionReviewIssue[] {
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
    ...props.fileProseConflicts.map((detail) => ({
      ruleCode: "cross_file_prose_constraint_conflict",
      moduleIndex: null,
      unitIndex: null,
      fixInstruction:
        "Remove the restated constraint value and use a backtick reference to the canonical definition in 02-domain-model instead. Example: 'THE system SHALL validate `User.bio` per entity constraints (see 02-domain-model)'",
      evidence: detail,
    })),
  ];
}

function buildSectionIndicesPerUnit(
  issues: AutoBeAnalyzeSectionReviewIssue[],
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
  rejected: AutoBeAnalyzeSectionReviewRejectedModuleUnit[] | null | undefined,
  fileIssues: AutoBeAnalyzeSectionReviewIssue[],
): AutoBeAnalyzeSectionReviewRejectedModuleUnit[] | null {
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
  issues: AutoBeAnalyzeSectionReviewIssue[],
  unitResults: AutoBeAnalyzeWriteUnitEvent[],
): AutoBeAnalyzeSectionReviewRejectedModuleUnit[] | null {
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

  const result: AutoBeAnalyzeSectionReviewRejectedModuleUnit[] = [];
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
  issues: AutoBeAnalyzeSectionReviewIssue[];
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
  issue: Pick<AutoBeAnalyzeSectionReviewIssue, "moduleIndex" | "unitIndex"> &
    Partial<Pick<AutoBeAnalyzeSectionReviewIssue, "sectionIndex">>,
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
  issues: AutoBeAnalyzeSectionReviewIssue[],
): AutoBeAnalyzeSectionReviewIssue[] {
  const map = new Map<string, AutoBeAnalyzeSectionReviewIssue>();
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

// ─── Per-module review helpers ───

function buildSiblingModuleSummaries(
  moduleEvent: AutoBeAnalyzeWriteModuleEvent,
  sectionResults: AutoBeAnalyzeWriteSectionEvent[][],
  excludeModuleIndex: number,
): Array<{
  moduleIndex: number;
  title: string;
  sectionTitles: string[];
}> {
  return sectionResults
    .map((sectionsForModule, moduleIndex) => ({
      moduleIndex,
      title: moduleEvent.moduleSections[moduleIndex]?.title ?? "Unknown",
      sectionTitles: sectionsForModule.flatMap((se) =>
        se.sectionSections.map((s) => s.title),
      ),
    }))
    .filter((s) => s.moduleIndex !== excludeModuleIndex);
}

function mergeModuleReviewEvents(
  moduleReviews: AutoBeAnalyzeSectionReviewEvent[],
  fileIndex: number,
): AutoBeAnalyzeSectionReviewEvent | null {
  if (moduleReviews.length === 0) return null;

  const allApproved = moduleReviews.every(
    (r) => r.fileResults[0]?.approved ?? true,
  );
  const allFeedback = moduleReviews
    .map((r) => r.fileResults[0]?.feedback)
    .filter(Boolean)
    .join("\n");
  const allRejectedModuleUnits = moduleReviews.flatMap(
    (r) => r.fileResults[0]?.rejectedModuleUnits ?? [],
  );
  const allIssues = moduleReviews.flatMap(
    (r) => r.fileResults[0]?.issues ?? [],
  );

  // Use the last review event as base (for tokenUsage, metric, etc.)
  const base = moduleReviews[moduleReviews.length - 1]!;
  return {
    ...base,
    fileResults: [
      {
        fileIndex,
        approved: allApproved,
        feedback: allFeedback,
        revisedSections: null,
        rejectedModuleUnits:
          allRejectedModuleUnits.length > 0 ? allRejectedModuleUnits : null,
        issues: allIssues.length > 0 ? allIssues : null,
      },
    ],
  };
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
    | AutoBeAnalyzeSectionReviewRejectedModuleUnit[]
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
  rejected: AutoBeAnalyzeSectionReviewRejectedModuleUnit[] | null | undefined,
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
  issues: AutoBeAnalyzeSectionReviewIssue[],
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
