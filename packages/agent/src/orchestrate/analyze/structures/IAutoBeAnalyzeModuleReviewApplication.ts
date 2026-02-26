import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

/**
 * Application interface for the Cross-File Module Review agent.
 *
 * This agent reviews ALL files' module sections together in a single LLM call,
 * providing cross-file validation for terminology, structure, and consistency.
 */
export interface IAutoBeAnalyzeModuleReviewApplication {
  /**
   * Process cross-file module review task or preliminary data requests.
   *
   * Reviews and validates module sections across ALL files in a single call,
   * ensuring cross-file consistency and uniformity.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeAnalyzeModuleReviewApplication.IProps): void;
}

export namespace IAutoBeAnalyzeModuleReviewApplication {
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
     * - Is terminology consistent across all files?
     * - Are structural patterns uniform across all files?
     * - Are scope boundaries clear and non-overlapping between files?
     * - Are abstraction levels consistent across all files?
     */
    thinking?: string | null;

    /** Type discriminator for the request. */
    request: IComplete | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to complete the cross-file module review.
   *
   * Provides per-file review verdicts for all files' module structures.
   */
  export interface IComplete {
    /** Type discriminator for the request. */
    type: "complete";

    /**
     * Per-file review results.
     *
     * Each entry contains the verdict for one file's module structure. Files
     * that are consistent with the overall structure are approved; files that
     * need adjustment are rejected with specific feedback.
     */
    fileResults: IFileResult[];
  }

  /** Per-file review result. */
  export interface IFileResult {
    /** Index of the file in the scenario's files array. */
    fileIndex: number;

    /**
     * Whether this file's module structure passed review.
     *
     * If true: File is consistent with other files. If false: File's module
     * must be regenerated with feedback.
     */
    approved: boolean;

    /**
     * Detailed review feedback for this file.
     *
     * Cross-file review criteria evaluated:
     *
     * - Terminology alignment with other files
     * - Structural consistency (depth, organization)
     * - Scope boundaries (no overlap with other files)
     * - Naming convention adherence
     *
     * For rejected files:
     *
     * - Specific inconsistencies identified
     * - Which files it conflicts with
     * - Recommendations for alignment
     */
    feedback: string;

    /** Revised title if modified during review. Set to `null` if no revision. */
    revisedTitle: string | null;

    /** Revised summary if modified during review. Set to `null` if no revision. */
    revisedSummary: string | null;

    /**
     * Revised module sections if modified during review.
     *
     * Set to `null` if no revisions were made.
     */
    revisedSections: IRevisedModuleSection[] | null;
  }

  /** Structure for a revised module section. */
  export interface IRevisedModuleSection {
    /** Title of the module section. */
    title: string;

    /** Purpose statement. */
    purpose: string;

    /** Section content. */
    content: string;
  }
}
