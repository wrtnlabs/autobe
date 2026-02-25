import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

/**
 * Application interface for the Unit Section Review agent.
 *
 * This agent is responsible for validating the unit section structure produced
 * by the Unit Generation agent before allowing progression to section
 * generation.
 */
export interface IAutoBeAnalyzeWriteUnitReviewApplication {
  /**
   * Process unit section review task or preliminary data requests.
   *
   * Reviews and validates the unit-level structure within a module section,
   * ensuring alignment with the parent section and proper coverage of
   * functional requirements.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeAnalyzeWriteUnitReviewApplication.IProps): void;
}

export namespace IAutoBeAnalyzeWriteUnitReviewApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests:
     *
     * - What additional context do you need for validation?
     *
     * For completion:
     *
     * - How well do the unit sections align with the module section?
     * - Are the keywords adequate for guiding section generation?
     * - What specific issues need to be addressed?
     */
    thinking: string;

    /** Type discriminator for the request. */
    request: IComplete | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to complete the unit section review.
   *
   * Provides the review verdict along with feedback and optional revisions.
   */
  export interface IComplete {
    /** Type discriminator for the request. */
    type: "complete";

    /** Index of the parent module section being reviewed. */
    moduleIndex: number;

    /**
     * Whether the unit section structure passed review.
     *
     * If true: Section generation can proceed. If false: Unit generation must
     * be retried with feedback.
     */
    approved: boolean;

    /**
     * Detailed review feedback.
     *
     * Review criteria evaluated:
     *
     * - Alignment with parent module section's purpose
     * - Completeness of functional requirement coverage
     * - Non-overlapping section boundaries
     * - Appropriate granularity for the document's scope
     * - Keywords adequately represent section topics
     *
     * For rejected submissions:
     *
     * - Specific issues identified
     * - Actionable recommendations for improvement
     * - Missing functional areas
     * - Keyword inadequacies
     */
    feedback: string;

    /**
     * Revised unit sections if modifications were made.
     *
     * Only provided if the reviewer made direct corrections. Set to `null` if
     * no revisions were made.
     */
    revisedSections: IRevisedUnitSection[] | null;
  }

  /** Structure for revised unit sections. */
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
