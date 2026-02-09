import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

/**
 * Application interface for the Major Section Review agent.
 *
 * This agent is responsible for validating the major section structure
 * produced by the Major Generation agent before allowing progression
 * to middle section generation.
 */
export interface IAutoBeAnalyzeWriteMajorReviewApplication {
  /**
   * Process major section review task or preliminary data requests.
   *
   * Reviews and validates the document's top-level structure, ensuring
   * it meets quality standards and properly covers all required topics.
   *
   * @param props Request containing either preliminary data request or complete task
   */
  process(props: IAutoBeAnalyzeWriteMajorReviewApplication.IProps): void;
}

export namespace IAutoBeAnalyzeWriteMajorReviewApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests:
     * - What additional context do you need to properly review?
     * - Why is this information necessary for validation?
     *
     * For completion (complete):
     * - What criteria did you evaluate?
     * - Why is the structure approved or rejected?
     * - What specific feedback will help improve the next iteration?
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     */
    request: IComplete | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to complete the major section review.
   *
   * Provides the review verdict (approved/rejected) along with feedback
   * and optional revisions to the structure.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     */
    type: "complete";

    /**
     * Whether the major section structure passed review.
     *
     * If true: Middle section generation can proceed.
     * If false: Major generation must be retried with the provided feedback.
     */
    approved: boolean;

    /**
     * Detailed review feedback.
     *
     * For approved submissions:
     * - Confirmation of met criteria
     * - Minor suggestions for future reference (optional)
     *
     * For rejected submissions:
     * - Specific issues identified
     * - Actionable recommendations for improvement
     * - Missing topics or coverage gaps
     * - Structural problems to address
     *
     * Review criteria evaluated:
     * - Title appropriateness and clarity
     * - Summary completeness and accuracy
     * - Major section coverage (all required topics)
     * - Non-overlapping section boundaries
     * - Logical organization
     */
    feedback: string;

    /**
     * Revised title if modifications were needed.
     *
     * Only provided if the reviewer made direct corrections.
     */
    revisedTitle?: string;

    /**
     * Revised summary if modifications were needed.
     */
    revisedSummary?: string;

    /**
     * Revised major sections if modifications were made.
     *
     * Only provided if the reviewer made direct corrections to fix
     * minor issues while still approving the overall structure.
     */
    revisedSections?: IRevisedMajorSection[];
  }

  /**
   * Structure for revised major sections.
   */
  export interface IRevisedMajorSection {
    /**
     * Title of the major section.
     */
    title: string;

    /**
     * Purpose statement.
     */
    purpose: string;

    /**
     * Section content.
     */
    content: string;
  }
}
