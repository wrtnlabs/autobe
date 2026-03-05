import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";

/**
 * Application interface for the Cross-File Section Consistency Review agent.
 *
 * This agent reviews ALL files' section metadata (titles, keywords, purposes)
 * together in a single LLM call, providing cross-file validation for
 * terminology alignment, value consistency, naming conventions, and content
 * deduplication.
 *
 * Unlike the per-file review which checks full content quality, this review
 * only receives lightweight metadata to stay within context limits.
 */
export interface IAutoBeAnalyzeSectionCrossFileReviewApplication {
  /**
   * Process cross-file section consistency review or preliminary data requests.
   *
   * Reviews section metadata across ALL files in a single call, ensuring
   * cross-file consistency and uniformity.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeAnalyzeSectionCrossFileReviewApplicationProps): void;
}

export interface IAutoBeAnalyzeSectionCrossFileReviewApplicationProps {
  /**
   * Think before you act.
   *
   * Before requesting preliminary data or completing your task, reflect on your
   * current state and explain your reasoning:
   *
   * For preliminary requests:
   *
   * - What additional context do you need for cross-file validation?
   *
   * For completion:
   *
   * - Are values and constraints consistent across all files?
   * - Is terminology aligned across all files?
   * - Are naming conventions consistent?
   * - Is there content duplication between files?
   */
  thinking?: string | null;

  /** Type discriminator for the request. */
  request:
    | IAutoBeAnalyzeSectionCrossFileReviewApplicationComplete
    | IAutoBePreliminaryGetPreviousAnalysisSections;
}

/**
 * Request to complete the cross-file section consistency review.
 *
 * Provides per-file review verdicts based on cross-file consistency checks.
 */
export interface IAutoBeAnalyzeSectionCrossFileReviewApplicationComplete {
  /** Type discriminator for the request. */
  type: "complete";

  /**
   * Per-file review results.
   *
   * Each entry contains the verdict for one file's consistency with other
   * files.
   */
  fileResults: IAutoBeAnalyzeSectionCrossFileReviewApplicationFileResult[];
}

/** Per-file review result from cross-file consistency check. */
export interface IAutoBeAnalyzeSectionCrossFileReviewApplicationFileResult {
  /** Index of the file in the scenario's files array. */
  fileIndex: number;

  /**
   * Whether this file's sections are consistent with other files.
   *
   * If true: File's sections are consistent across files. If false: File's
   * sections must be regenerated with feedback to align with other files.
   */
  approved: boolean;

  /**
   * Detailed cross-file consistency feedback for this file.
   *
   * Criteria evaluated:
   *
   * - Value and constraint consistency across files
   * - Terminology alignment
   * - Naming convention consistency
   * - Content deduplication
   * - Structural balance
   *
   * For rejected files:
   *
   * - Specific cross-file inconsistencies identified
   * - Recommendations for alignment with other files
   */
  feedback: string;

  /**
   * Structured review issues for targeted rewrites / patches.
   *
   * Optional for backward compatibility.
   */
  issues?: IAutoBeAnalyzeSectionCrossFileReviewApplicationReviewIssue[] | null;

  /**
   * Specific module/unit pairs whose sections have cross-file consistency
   * issues.
   *
   * When rejecting a file, identify EXACTLY which modules and units are
   * inconsistent with other files. Only these will be regenerated on retry.
   *
   * Set to null if all module/units need regeneration, or if approving.
   */
  rejectedModuleUnits:
    | IAutoBeAnalyzeSectionCrossFileReviewApplicationRejectedModuleUnit[]
    | null;
}

/** Identifies specific module/unit pairs whose sections were rejected. */
export interface IAutoBeAnalyzeSectionCrossFileReviewApplicationRejectedModuleUnit {
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
  issues?: IAutoBeAnalyzeSectionCrossFileReviewApplicationReviewIssue[] | null;

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

export interface IAutoBeAnalyzeSectionCrossFileReviewApplicationReviewIssue {
  ruleCode: string;
  moduleIndex: number | null;
  unitIndex: number | null;
  sectionIndex?: number | null;
  fixInstruction: string;
  evidence?: string | null;
}
