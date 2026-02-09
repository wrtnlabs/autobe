import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

/**
 * Application interface for the Middle Section Review agent.
 *
 * This agent is responsible for validating the middle section structure
 * produced by the Middle Generation agent before allowing progression
 * to minor section generation.
 */
export interface IAutoBeAnalyzeWriteMiddleReviewApplication {
  /**
   * Process middle section review task or preliminary data requests.
   *
   * Reviews and validates the middle-level structure within a major section,
   * ensuring alignment with the parent section and proper coverage of
   * functional requirements.
   *
   * @param props Request containing either preliminary data request or complete task
   */
  process(props: IAutoBeAnalyzeWriteMiddleReviewApplication.IProps): void;
}

export namespace IAutoBeAnalyzeWriteMiddleReviewApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests:
     * - What additional context do you need for validation?
     *
     * For completion:
     * - How well do the middle sections align with the major section?
     * - Are the keywords adequate for guiding minor generation?
     * - What specific issues need to be addressed?
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     */
    request: IComplete | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to complete the middle section review.
   *
   * Provides the review verdict along with feedback and optional revisions.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     */
    type: "complete";

    /**
     * Index of the parent major section being reviewed.
     */
    majorIndex: number;

    /**
     * Whether the middle section structure passed review.
     *
     * If true: Minor section generation can proceed.
     * If false: Middle generation must be retried with feedback.
     */
    approved: boolean;

    /**
     * Detailed review feedback.
     *
     * Review criteria evaluated:
     * - Alignment with parent major section's purpose
     * - Completeness of functional requirement coverage
     * - Non-overlapping section boundaries
     * - Appropriate granularity for the document's scope
     * - Keywords adequately represent minor section topics
     *
     * For rejected submissions:
     * - Specific issues identified
     * - Actionable recommendations for improvement
     * - Missing functional areas
     * - Keyword inadequacies
     */
    feedback: string;

    /**
     * Revised middle sections if modifications were made.
     *
     * Only provided if the reviewer made direct corrections.
     */
    revisedSections?: IRevisedMiddleSection[];
  }

  /**
   * Structure for revised middle sections.
   */
  export interface IRevisedMiddleSection {
    /**
     * Title of the middle section.
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

    /**
     * Keywords for minor section guidance.
     */
    keywords: string[];
  }
}
