import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

/**
 * Application interface for the Cross-File Unit Review agent.
 *
 * This agent reviews ALL files' unit sections together in a single LLM call,
 * providing cross-file validation for functional decomposition consistency,
 * keyword style, and depth balance.
 */
export interface IAutoBeAnalyzeUnitReviewApplication {
  /**
   * Process cross-file unit review task or preliminary data requests.
   *
   * Reviews and validates unit sections across ALL files in a single call,
   * ensuring cross-file consistency and uniformity.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeAnalyzeUnitReviewApplication.IProps): void;
}

export namespace IAutoBeAnalyzeUnitReviewApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests:
     *
     * - What additional context do you need for cross-file validation?
     *
     * For completion:
     *
     * - Is functional decomposition consistent across all files?
     * - Are keyword styles uniform across all files?
     * - Are depth levels balanced across all files?
     * - Are section boundaries clear and non-overlapping between files?
     */
    thinking?: string | null;

    /** Type discriminator for the request. */
    request: IComplete | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to complete the cross-file unit review.
   *
   * Provides per-file review verdicts for all files' unit structures.
   */
  export interface IComplete {
    /** Type discriminator for the request. */
    type: "complete";

    /**
     * Per-file review results.
     *
     * Each entry contains the verdict for one file's unit structure.
     */
    fileResults: IFileResult[];
  }

  /** Per-file review result. */
  export interface IFileResult {
    /** Index of the file in the scenario's files array. */
    fileIndex: number;

    /**
     * Whether this file's unit structure passed review.
     *
     * If true: File's units are consistent with other files. If false: File's
     * units must be regenerated with feedback.
     */
    approved: boolean;

    /**
     * Detailed review feedback for this file's unit structure.
     *
     * Cross-file review criteria evaluated:
     *
     * - Functional decomposition alignment
     * - Keyword style consistency
     * - Depth balance with other files
     * - Section boundary clarity
     *
     * For rejected files:
     *
     * - Specific inconsistencies identified
     * - Recommendations for alignment
     */
    feedback: string;

    /**
     * Revised units for this file if modifications were made.
     *
     * Indexed by moduleIndex. Set to `null` if no revisions were made.
     */
    revisedUnits: IRevisedModuleUnit[] | null;

    /**
     * Specific modules whose units were rejected.
     *
     * When rejecting a file, identify EXACTLY which modules have problematic
     * unit sections. Only these modules will be regenerated on retry.
     *
     * Set to null if all modules need regeneration, or if approving.
     */
    rejectedModules: IRejectedModule[] | null;
  }

  /** Identifies a module whose unit sections were rejected. */
  export interface IRejectedModule {
    /** Index of the module section that needs unit regeneration. */
    moduleIndex: number;

    /** Specific feedback for this module's unit issues. */
    feedback: string;
  }

  /** Structure for revised units of a single module section. */
  export interface IRevisedModuleUnit {
    /** Index of the module section these units belong to. */
    moduleIndex: number;

    /** Revised unit sections for this module. */
    unitSections: IRevisedUnitSection[];
  }

  /** Structure for a revised unit section. */
  export interface IRevisedUnitSection {
    /** Title of the unit section. */
    title: string;

    /** Purpose statement. */
    purpose: string;

    /** Section content. */
    content: string;

    /** Keywords for section guidance. */
    keywords: string[];
  }
}
