import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";

/**
 * Reviews all files' section content for cross-file value consistency,
 * terminology, Mermaid style, and EARS format.
 */
export interface IAutoBeAnalyzeSectionReviewApplication {
  /** Review section content across all files for cross-file consistency. */
  process(props: IAutoBeAnalyzeSectionReviewApplicationProps): void;
}

export interface IAutoBeAnalyzeSectionReviewApplicationProps {
  /**
   * Reasoning about your current state: what's missing (preliminary) or what
   * you accomplished (completion).
   */
  thinking?: string | null;

  /** Action to perform. Exhausted preliminary types are removed from the union. */
  request:
    | IAutoBeAnalyzeSectionReviewApplicationComplete
    | IAutoBePreliminaryGetPreviousAnalysisSections;
}

/** Complete the cross-file section review with per-file verdicts. */
export interface IAutoBeAnalyzeSectionReviewApplicationComplete {
  /** Type discriminator for completion request. */
  type: "complete";

  /** Per-file review results. */
  fileResults: IAutoBeAnalyzeSectionReviewApplicationFileResult[];
}

/** Per-file review result. */
export interface IAutoBeAnalyzeSectionReviewApplicationFileResult {
  /** Index of the file in the scenario's files array. */
  fileIndex: number;

  /** Whether this file's section content passed review. */
  approved: boolean;

  /**
   * Cross-file review feedback. For rejected files, describe specific
   * inconsistencies.
   */
  feedback: string;

  /**
   * Structured review issues for targeted rewrites. Optional for backward
   * compatibility.
   */
  issues?: IAutoBeAnalyzeSectionReviewApplicationReviewIssue[] | null;

  /** Revised sections organized by moduleIndex/unitIndex. Null if no revisions. */
  revisedSections:
    | IAutoBeAnalyzeSectionReviewApplicationRevisedModuleSections[]
    | null;

  /**
   * Module/unit pairs with rejected sections. Only these are regenerated on
   * retry. Null if all module/units need regeneration, or if approving.
   */
  rejectedModuleUnits:
    | IAutoBeAnalyzeSectionReviewApplicationRejectedModuleUnit[]
    | null;
}

/** Identifies specific module/unit pairs whose sections were rejected. */
export interface IAutoBeAnalyzeSectionReviewApplicationRejectedModuleUnit {
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
  issues?: IAutoBeAnalyzeSectionReviewApplicationReviewIssue[] | null;

  /**
   * Per-unit mapping of section indices needing regeneration. When null or a
   * unitIndex is absent, ALL sections for that unit are regenerated.
   */
  sectionIndicesPerUnit?: Record<number, number[]> | null;
}

/** A specific review issue found during section content review. */
export interface IAutoBeAnalyzeSectionReviewApplicationReviewIssue {
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

/** Revised sections of a single module. */
export interface IAutoBeAnalyzeSectionReviewApplicationRevisedModuleSections {
  /** Index of the module section. */
  moduleIndex: number;

  /** Revised sections for each unit. */
  units: IAutoBeAnalyzeSectionReviewApplicationRevisedUnitSections[];
}

/** Revised sections of a single unit. */
export interface IAutoBeAnalyzeSectionReviewApplicationRevisedUnitSections {
  /** Index of the unit section. */
  unitIndex: number;

  /** Revised subsections (#### level) within this unit. */
  sectionSections: IAutoBeAnalyzeSectionReviewApplicationRevisedSectionSection[];
}

/** A revised section. */
export interface IAutoBeAnalyzeSectionReviewApplicationRevisedSectionSection {
  /** Title of the section. */
  title: string;

  /** Revised content. */
  content: string;
}
