import { AutoBeAnalyzeSectionContent } from "./AutoBeAnalyzeWriteSectionEvent";
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
    AutoBeAcquisitionEventBase<"previousAnalysisSections"> {
  /**
   * Per-file review results.
   *
   * Each entry contains the review verdict for a specific file's section
   * content, including whether it was approved, feedback for improvement, and
   * optional revisions.
   */
  fileResults: AutoBeAnalyzeSectionReviewFileResult[];

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

/** Per-file result from the cross-file section review. */
export interface AutoBeAnalyzeSectionReviewFileResult {
  /** Index of the file in the scenario's files array. */
  fileIndex: number;

  /**
   * Whether this file's section content passed the cross-file review.
   *
   * If true, the file's sections are consistent with the overall content. If
   * false, the file's sections must be regenerated with feedback.
   */
  approved: boolean;

  /**
   * Detailed review feedback for this specific file's section content.
   *
   * Contains specific issues and recommendations for aligning with other files.
   */
  feedback: string;

  /**
   * Structured review issues for deterministic retry handling.
   *
   * Optional for backward compatibility. When omitted, orchestrators may derive
   * issues from free-form feedback and rejected module/unit metadata.
   */
  issues?: AutoBeAnalyzeSectionReviewIssue[] | null;

  /**
   * Revised sections for this file if modifications were made during review.
   *
   * Organized by module and unit indices. Set to `null` if no revisions were
   * made.
   */
  revisedSections: AutoBeAnalyzeSectionReviewRevisedModuleSections[] | null;

  /**
   * Specific module/unit pairs whose sections were rejected.
   *
   * When non-null, only these module/units need section regeneration on retry.
   * When null or undefined, all module/units are considered rejected
   * (backward-compatible fallback to regenerate all).
   */
  rejectedModuleUnits: AutoBeAnalyzeSectionReviewRejectedModuleUnit[] | null;
}

/** Identifies specific module/unit pairs whose sections were rejected. */
export interface AutoBeAnalyzeSectionReviewRejectedModuleUnit {
  /** Index of the module section. */
  moduleIndex: number;

  /** Indices of units within this module that need section regeneration. */
  unitIndices: number[];

  /** Specific feedback for this module/unit group's issues. */
  feedback: string;

  /**
   * Structured issues scoped to this module/unit group.
   *
   * Optional for backward compatibility.
   */
  issues?: AutoBeAnalyzeSectionReviewIssue[] | null;

  /**
   * Per-unit mapping of specific section indices that need regeneration.
   *
   * Keys are unit indices (from `unitIndices`), values are arrays of section
   * indices within that unit's `sectionSections[]` that failed review.
   *
   * When null/undefined or when a unitIndex is not present as a key, ALL
   * sections for that unit are regenerated (backward-compatible fallback).
   */
  sectionIndicesPerUnit?: Record<number, number[]> | null;
}

/** Structured review issue for targeted rewrites / patches. */
export interface AutoBeAnalyzeSectionReviewIssue {
  /** Stable rule identifier (e.g., missing_bridge_block, non_ears_format). */
  ruleCode: string;

  /** Target module index, or null if file-level issue. */
  moduleIndex: number | null;

  /** Target unit index, or null if module/file-level issue. */
  unitIndex: number | null;

  /** Optional target section index for finer-grained guidance. */
  sectionIndex?: number | null;

  /** Concrete repair instruction to apply on the next retry. */
  fixInstruction: string;

  /** Optional supporting evidence snippet or summary. */
  evidence?: string | null;
}

/** Structure for revised sections of a single module. */
export interface AutoBeAnalyzeSectionReviewRevisedModuleSections {
  /** Index of the module section. */
  moduleIndex: number;

  /** Revised sections for each unit in this module. */
  units: AutoBeAnalyzeSectionReviewRevisedUnitSections[];
}

/** Structure for revised sections of a single unit. */
export interface AutoBeAnalyzeSectionReviewRevisedUnitSections {
  /** Index of the unit section. */
  unitIndex: number;

  /** Revised section sections for this unit. */
  sectionSections: AutoBeAnalyzeSectionContent[];
}
