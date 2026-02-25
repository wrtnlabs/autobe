import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

/**
 * Application interface for the Module Section Review agent.
 *
 * This agent is responsible for validating the module section structure
 * produced by the Module Generation agent before allowing progression to unit
 * section generation.
 */
export interface IAutoBeAnalyzeWriteModuleReviewApplication {
  /**
   * Process module section review task or preliminary data requests.
   *
   * Reviews and validates the document's top-level structure, ensuring it meets
   * quality standards and properly covers all required topics.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeAnalyzeWriteModuleReviewApplication.IProps): void;
}

export namespace IAutoBeAnalyzeWriteModuleReviewApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests:
     *
     * - What additional context do you need to properly review?
     * - Why is this information necessary for validation?
     *
     * For completion (complete):
     *
     * - What criteria did you evaluate?
     * - Why is the structure approved or rejected?
     * - What specific feedback will help improve the next iteration?
     */
    thinking: string;

    /** Type discriminator for the request. */
    request: IComplete | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to complete the module section review.
   *
   * Provides the review verdict (approved/rejected) along with feedback and
   * optional revisions to the structure.
   */
  export interface IComplete {
    /** Type discriminator for the request. */
    type: "complete";

    /**
     * Whether the module section structure passed review.
     *
     * If true: Unit section generation can proceed. If false: Module generation
     * must be retried with the provided feedback.
     */
    approved: boolean;

    /**
     * Detailed review feedback.
     *
     * For approved submissions:
     *
     * - Confirmation of met criteria
     * - Suggestions for future reference (optional)
     *
     * For rejected submissions:
     *
     * - Specific issues identified
     * - Actionable recommendations for improvement
     * - Missing topics or coverage gaps
     * - Structural problems to address
     *
     * Review criteria evaluated:
     *
     * - Title appropriateness and clarity
     * - Summary completeness and accuracy
     * - Module section coverage (all required topics)
     * - Non-overlapping section boundaries
     * - Logical organization
     */
    feedback: string;

    /**
     * Revised title if modifications were needed.
     *
     * Only provided if the reviewer made direct corrections. Set to `null` if
     * no revisions were made.
     */
    revisedTitle: string | null;

    /**
     * Revised summary if modifications were needed. Set to `null` if no
     * revisions were made.
     */
    revisedSummary: string | null;

    /**
     * Revised module sections if modifications were made.
     *
     * Only provided if the reviewer made direct corrections to fix issues while
     * still approving the overall structure. Set to `null` if no revisions were
     * made.
     */
    revisedSections: IRevisedModuleSection[] | null;
  }

  /** Structure for revised module sections. */
  export interface IRevisedModuleSection {
    /** Title of the module section. */
    title: string;

    /** Purpose statement. */
    purpose: string;

    /** Section content. */
    content: string;
  }
}
