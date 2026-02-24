import { AutoBeAnalyzeWriteSectionEvent } from "./AutoBeAnalyzeWriteSectionEvent";
import { AutoBeAcquisitionEventBase } from "./base/AutoBeAcquisitionEventBase";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the cross-file review phase of section sections (###)
 * across ALL files.
 *
 * This event represents the final cross-file quality assurance step where ALL
 * files' section content is reviewed together in a single LLM call. The
 * Cross-File Section Review Agent validates EARS format uniformity, value
 * consistency, terminology alignment, and Mermaid diagram style across the
 * entire set of files before final document assembly.
 *
 * Review criteria include:
 *
 * - EARS format compliance consistency across all files
 * - Value and constraint consistency (limits, thresholds, etc.)
 * - Terminology alignment across all files
 * - Mermaid diagram style uniformity
 * - No prohibited content in any file
 * - Complete keyword coverage in all files
 *
 * Review outcomes are per-file:
 *
 * - **Approved**: File's section content is consistent with other files
 * - **Rejected**: File needs section revision to align with the overall content
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeSectionReviewEvent
  extends
    AutoBeEventBase<"analyzeSectionReview">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase,
    AutoBeAcquisitionEventBase<"previousAnalysisFiles"> {
  /**
   * Per-file review results.
   *
   * Each entry contains the review verdict for a specific file's section
   * content, including whether it was approved, feedback for improvement,
   * and optional revisions.
   */
  fileResults: AutoBeAnalyzeSectionReviewEvent.IFileResult[];

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

export namespace AutoBeAnalyzeSectionReviewEvent {
  /** Per-file result from the cross-file section review. */
  export interface IFileResult {
    /** Index of the file in the scenario's files array. */
    fileIndex: number;

    /**
     * Whether this file's section content passed the cross-file review.
     *
     * If true, the file's sections are consistent with the overall content.
     * If false, the file's sections must be regenerated with feedback.
     */
    approved: boolean;

    /**
     * Detailed review feedback for this specific file's section content.
     *
     * Contains specific issues and recommendations for aligning with other
     * files.
     */
    feedback: string;

    /**
     * Revised sections for this file if modifications were made during review.
     *
     * Organized by module and unit indices. Set to `null` if no revisions were
     * made.
     */
    revisedSections: IRevisedModuleSections[] | null;

    /**
     * Specific module/unit pairs whose sections were rejected.
     *
     * When non-null, only these module/units need section regeneration on retry.
     * When null or undefined, all module/units are considered rejected
     * (backward-compatible fallback to regenerate all).
     */
    rejectedModuleUnits: IRejectedModuleUnit[] | null;
  }

  /** Identifies specific module/unit pairs whose sections were rejected. */
  export interface IRejectedModuleUnit {
    /** Index of the module section. */
    moduleIndex: number;

    /** Indices of units within this module that need section regeneration. */
    unitIndices: number[];

    /** Specific feedback for this module/unit group's issues. */
    feedback: string;
  }

  /** Structure for revised sections of a single module. */
  export interface IRevisedModuleSections {
    /** Index of the module section. */
    moduleIndex: number;

    /** Revised sections for each unit in this module. */
    units: IRevisedUnitSections[];
  }

  /** Structure for revised sections of a single unit. */
  export interface IRevisedUnitSections {
    /** Index of the unit section. */
    unitIndex: number;

    /** Revised section sections for this unit. */
    sectionSections: AutoBeAnalyzeWriteSectionEvent.ISectionSection[];
  }
}
