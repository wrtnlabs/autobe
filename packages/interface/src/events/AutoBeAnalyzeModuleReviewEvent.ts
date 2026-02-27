import { AutoBeAnalyzeWriteModuleEvent } from "./AutoBeAnalyzeWriteModuleEvent";
import { AutoBeAcquisitionEventBase } from "./base/AutoBeAcquisitionEventBase";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the cross-file review phase of module sections (#) across
 * ALL files.
 *
 * This event represents the cross-file quality assurance step where ALL files'
 * module structures are reviewed together in a single LLM call. The Cross-File
 * Module Review Agent validates consistency, terminology, and structural
 * uniformity across the entire set of files before allowing progression to the
 * unit generation stage.
 *
 * Review criteria include:
 *
 * - Terminology consistency across all files
 * - Structural uniformity (similar depth and abstraction levels)
 * - Scope coverage without overlap between files
 * - Consistent naming conventions and organizational patterns
 *
 * Review outcomes are per-file:
 *
 * - **Approved**: File's module structure is consistent with other files
 * - **Rejected**: File needs revision to align with the overall structure
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeModuleReviewEvent
  extends
    AutoBeEventBase<"analyzeModuleReview">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase,
    AutoBeAcquisitionEventBase<"previousAnalysisFiles"> {
  /**
   * Per-file review results.
   *
   * Each entry contains the review verdict for a specific file, including
   * whether it was approved, feedback for improvement, and optional revisions.
   */
  fileResults: AutoBeAnalyzeModuleReviewEvent.IFileResult[];

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

export namespace AutoBeAnalyzeModuleReviewEvent {
  /** Per-file result from the cross-file module review. */
  export interface IFileResult {
    /** Index of the file in the scenario's files array. */
    fileIndex: number;

    /**
     * Whether this file's module structure passed the cross-file review.
     *
     * If true, the file's module is consistent with the overall structure. If
     * false, the file's module must be regenerated with feedback.
     */
    approved: boolean;

    /**
     * Detailed review feedback for this specific file.
     *
     * Contains specific issues and recommendations for aligning with other
     * files' structures.
     */
    feedback: string;

    /** Revised title if modified during review. Set to `null` if no revision. */
    revisedTitle: string | null;

    /** Revised summary if modified during review. Set to `null` if no revision. */
    revisedSummary: string | null;

    /**
     * Revised module sections if modified during review. Set to `null` if no
     * revision.
     */
    revisedSections: AutoBeAnalyzeWriteModuleEvent.IModuleSection[] | null;
  }
}
