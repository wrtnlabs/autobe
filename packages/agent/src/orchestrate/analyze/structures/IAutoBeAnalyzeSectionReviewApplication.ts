import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";

/**
 * Application interface for the Cross-File Section Review agent.
 *
 * This agent reviews ALL files' section content together in a single LLM call,
 * providing cross-file validation for EARS format, value consistency,
 * terminology, and Mermaid diagram style.
 */
export interface IAutoBeAnalyzeSectionReviewApplication {
  /**
   * Process cross-file section review task or preliminary data requests.
   *
   * Reviews and validates section content across ALL files in a single call,
   * ensuring cross-file consistency and uniformity.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeAnalyzeSectionReviewApplicationProps): void;
}

export interface IAutoBeAnalyzeSectionReviewApplicationProps {
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
   * - Is EARS format consistent across all files?
   * - Are values and constraints consistent across all files?
   * - Is terminology aligned across all files?
   * - Are Mermaid diagram styles uniform?
   */
  thinking?: string | null;

  /** Type discriminator for the request. */
  request:
    | IAutoBeAnalyzeSectionReviewApplicationComplete
    | IAutoBePreliminaryGetPreviousAnalysisSections;
}

/**
 * Request to complete the cross-file section review.
 *
 * Provides per-file review verdicts for all files' section content.
 */
export interface IAutoBeAnalyzeSectionReviewApplicationComplete {
  /** Type discriminator for the request. */
  type: "complete";

  /**
   * Per-file review results.
   *
   * Each entry contains the verdict for one file's section content.
   */
  fileResults: IAutoBeAnalyzeSectionReviewApplicationFileResult[];
}

/** Per-file review result. */
export interface IAutoBeAnalyzeSectionReviewApplicationFileResult {
  /** Index of the file in the scenario's files array. */
  fileIndex: number;

  /**
   * Whether this file's section content passed review.
   *
   * If true: File's sections are consistent with other files. If false: File's
   * sections must be regenerated with feedback.
   */
  approved: boolean;

  /**
   * Detailed review feedback for this file's section content.
   *
   * Cross-file review criteria evaluated:
   *
   * - EARS format compliance consistency
   * - Value and constraint consistency
   * - Terminology alignment
   * - Mermaid diagram style uniformity
   * - No prohibited content
   *
   * For rejected files:
   *
   * - Specific inconsistencies identified
   * - Recommendations for alignment
   */
  feedback: string;

  /**
   * Structured review issues for targeted rewrites / patches.
   *
   * Optional for backward compatibility.
   */
  issues?: IAutoBeAnalyzeSectionReviewApplicationReviewIssue[] | null;

  /**
   * Revised sections for this file if modifications were made.
   *
   * Organized by moduleIndex and unitIndex. Set to `null` if no revisions were
   * made.
   */
  revisedSections:
    | IAutoBeAnalyzeSectionReviewApplicationRevisedModuleSections[]
    | null;

  /**
   * Specific module/unit pairs whose sections were rejected.
   *
   * When rejecting a file, identify EXACTLY which modules and units have
   * problematic sections. Only these will be regenerated on retry.
   *
   * Set to null if all module/units need regeneration, or if approving.
   */
  rejectedModuleUnits:
    | IAutoBeAnalyzeSectionReviewApplicationRejectedModuleUnit[]
    | null;
}

/** Identifies specific module/unit pairs whose sections were rejected. */
export interface IAutoBeAnalyzeSectionReviewApplicationRejectedModuleUnit {
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
  issues?: IAutoBeAnalyzeSectionReviewApplicationReviewIssue[] | null;

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

export interface IAutoBeAnalyzeSectionReviewApplicationReviewIssue {
  ruleCode: string;
  moduleIndex: number | null;
  unitIndex: number | null;
  sectionIndex?: number | null;
  fixInstruction: string;
  evidence?: string | null;
}

/** Structure for revised sections of a single module. */
export interface IAutoBeAnalyzeSectionReviewApplicationRevisedModuleSections {
  /** Index of the module section. */
  moduleIndex: number;

  /** Revised sections for each unit in this module. */
  units: IAutoBeAnalyzeSectionReviewApplicationRevisedUnitSections[];
}

/** Structure for revised sections of a single unit. */
export interface IAutoBeAnalyzeSectionReviewApplicationRevisedUnitSections {
  /** Index of the unit section. */
  unitIndex: number;

  /** Revised section sections for this unit. */
  sectionSections: IAutoBeAnalyzeSectionReviewApplicationRevisedSectionSection[];
}

/** Structure for a revised section. */
export interface IAutoBeAnalyzeSectionReviewApplicationRevisedSectionSection {
  /** Title of the section. */
  title: string;

  /** Revised content. */
  content: string;
}
