import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";

/**
 * Reviews all files' section metadata in a single call for cross-file
 * terminology, value, and naming consistency.
 */
export interface IAutoBeAnalyzeSectionCrossFileReviewApplication {
  /** Review section metadata across all files for cross-file consistency. */
  process(props: IAutoBeAnalyzeSectionCrossFileReviewApplicationProps): void;
}

export interface IAutoBeAnalyzeSectionCrossFileReviewApplicationProps {
  /**
   * Reasoning: what's missing (preliminary), what you're submitting (write), or
   * why you're finalizing (complete).
   */
  thinking?: string | null;

  /**
   * Action to perform. Write can be called up to 3 times; after the 3rd write,
   * completion is forced. Exhausted preliminary types are removed from the
   * union.
   */
  request:
    | IAutoBeAnalyzeSectionCrossFileReviewApplicationWrite
    | IAutoBePreliminaryComplete
    | IAutoBePreliminaryGetPreviousAnalysisSections;
}

/** Submit the cross-file section consistency review with per-file verdicts. */
export interface IAutoBeAnalyzeSectionCrossFileReviewApplicationWrite {
  /** Type discriminator for write submission. */
  type: "write";

  /** Per-file review results. */
  fileResults: IAutoBeAnalyzeSectionCrossFileReviewApplicationFileResult[];
}

/** Per-file review result from cross-file consistency check. */
export interface IAutoBeAnalyzeSectionCrossFileReviewApplicationFileResult {
  /** Index of the file in the scenario's files array. */
  fileIndex: number;

  /** Whether this file's sections are consistent with other files. */
  approved: boolean;

  /**
   * Cross-file consistency feedback. For rejected files, describe specific
   * inconsistencies.
   */
  feedback: string;

  /**
   * Structured review issues for targeted rewrites. Optional for backward
   * compatibility.
   */
  issues?: IAutoBeAnalyzeSectionCrossFileReviewApplicationReviewIssue[] | null;

  /**
   * Module/unit pairs with cross-file consistency issues. Only these are
   * regenerated on retry. Set to null if all module/units need regeneration, or
   * if approving.
   */
  rejectedModuleUnits:
    | IAutoBeAnalyzeSectionCrossFileReviewApplicationRejectedModuleUnit[]
    | null;
}

/** Identifies specific module/unit pairs whose sections were rejected. */
export interface IAutoBeAnalyzeSectionCrossFileReviewApplicationRejectedModuleUnit {
  /** Index of the module section. */
  moduleIndex: number;

  /** Unit indices needing section regeneration. */
  unitIndices: number[];

  /** Feedback for this module/unit group's issues. */
  feedback: string;

  /**
   * Structured issues scoped to this module/unit group. Optional for backward
   * compatibility.
   */
  issues?: IAutoBeAnalyzeSectionCrossFileReviewApplicationReviewIssue[] | null;

  /**
   * Per-unit mapping of section indices needing regeneration. When null or a
   * unitIndex is absent, ALL sections for that unit are regenerated.
   */
  sectionIndicesPerUnit?: Record<number, number[]> | null;
}

/** A specific review issue found during cross-file consistency check. */
export interface IAutoBeAnalyzeSectionCrossFileReviewApplicationReviewIssue {
  /** Rule violation code (e.g., "TERM-001", "VALUE-002"). */
  ruleCode: string;
  /** Module index where the issue was found, or null if file-level. */
  moduleIndex: number | null;
  /** Unit index where the issue was found, or null if module-level. */
  unitIndex: number | null;
  /** Section index where the issue was found, or null if unit-level. */
  sectionIndex?: number | null;
  /** Specific instruction for fixing this issue. */
  fixInstruction: string;
  /** Supporting evidence from the source text. */
  evidence?: string | null;
}
