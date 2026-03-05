import { AutoBeAnalyzeUnitSection } from "./AutoBeAnalyzeWriteUnitEvent";
import { AutoBeAcquisitionEventBase } from "./base/AutoBeAcquisitionEventBase";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the cross-file review phase of unit sections (##) across
 * ALL files.
 *
 * This event represents the cross-file quality assurance step where ALL files'
 * unit structures are reviewed together in a single LLM call. The Cross-File
 * Unit Review Agent validates consistency in functional decomposition, keyword
 * style, and depth balance across the entire set of files before allowing
 * progression to the section generation stage.
 *
 * Review criteria include:
 *
 * - Functional decomposition consistency across files
 * - Keyword style and specificity uniformity
 * - Depth balance (similar granularity levels)
 * - Non-overlapping responsibilities between files
 * - Consistent section boundary patterns
 *
 * Review outcomes are per-file:
 *
 * - **Approved**: File's unit structure is consistent with other files
 * - **Rejected**: File needs unit revision to align with the overall structure
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeUnitReviewEvent
  extends
    AutoBeEventBase<"analyzeUnitReview">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase,
    AutoBeAcquisitionEventBase<"previousAnalysisSections"> {
  /**
   * Per-file review results.
   *
   * Each entry contains the review verdict for a specific file's unit
   * structure, including whether it was approved, feedback for improvement, and
   * optional revisions.
   */
  fileResults: AutoBeAnalyzeUnitReviewFileResult[];

  /**
   * Current iteration number of the review process.
   *
   * Tracks how many cross-file review cycles have been completed.
   */
  step: number;

  /**
   * Retry attempt number for this event.
   *
   * Starts at 0 for the first attempt. Increments each time some files are
   * rejected and their generation is retried.
   */
  retry: number;
}

/** Per-file result from the cross-file unit review. */
export interface AutoBeAnalyzeUnitReviewFileResult {
  /** Index of the file in the scenario's files array. */
  fileIndex: number;

  /**
   * Whether this file's unit structure passed the cross-file review.
   *
   * If true, the file's units are consistent with the overall structure. If
   * false, the file's units must be regenerated with feedback.
   */
  approved: boolean;

  /**
   * Detailed review feedback for this specific file's unit structure.
   *
   * Contains specific issues and recommendations for aligning with other files.
   */
  feedback: string;

  /**
   * Revised units for this file if modifications were made during review.
   *
   * Indexed by moduleIndex, each entry contains revised unit sections for that
   * module. Set to `null` if no revisions were made.
   */
  revisedUnits: AutoBeAnalyzeUnitReviewRevisedModuleUnit[] | null;

  /**
   * Specific modules whose units were rejected.
   *
   * When non-null, only these modules need unit regeneration on retry. When
   * null or undefined, all modules are considered rejected (backward-compatible
   * fallback to regenerate all).
   */
  rejectedModules: AutoBeAnalyzeUnitReviewRejectedModule[] | null;
}

/** Identifies a specific module whose unit sections were rejected. */
export interface AutoBeAnalyzeUnitReviewRejectedModule {
  /** Index of the module section that needs unit regeneration. */
  moduleIndex: number;

  /** Specific feedback for this module's unit issues. */
  feedback: string;
}

/** Structure for revised units of a single module section. */
export interface AutoBeAnalyzeUnitReviewRevisedModuleUnit {
  /** Index of the module section these units belong to. */
  moduleIndex: number;

  /** Revised unit sections for this module. */
  unitSections: AutoBeAnalyzeUnitSection[];
}
