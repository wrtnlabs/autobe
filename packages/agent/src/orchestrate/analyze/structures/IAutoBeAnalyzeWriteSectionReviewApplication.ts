import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

/**
 * Application interface for the Section Review agent.
 *
 * This agent is responsible for validating the section content produced by the
 * Section Generation agent, ensuring implementation-ready quality before final
 * document assembly.
 */
export interface IAutoBeAnalyzeWriteSectionReviewApplication {
  /**
   * Process section review task or preliminary data requests.
   *
   * Reviews and validates the detailed content within a unit section, ensuring
   * quality standards for EARS format, Mermaid syntax, and overall
   * specification completeness.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeAnalyzeWriteSectionReviewApplication.IProps): void;
}

export namespace IAutoBeAnalyzeWriteSectionReviewApplication {
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
     * - Are requirements properly formatted in EARS?
     * - Are Mermaid diagrams syntactically correct?
     * - Is the content implementation-ready?
     * - Are there any prohibited contents?
     */
    thinking: string;

    /** Type discriminator for the request. */
    request: IComplete | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to complete the section review.
   *
   * Provides the review verdict along with feedback and optional revisions.
   * This is the final quality gate before document assembly.
   */
  export interface IComplete {
    /** Type discriminator for the request. */
    type: "complete";

    /** Index of the grandparent module section. */
    moduleIndex: number;

    /** Index of the parent unit section. */
    unitIndex: number;

    /**
     * Whether the section content passed review.
     *
     * If true: Content is ready for final document assembly. If false: Section
     * generation must be retried with feedback.
     */
    approved: boolean;

    /**
     * Detailed review feedback.
     *
     * Review criteria evaluated:
     *
     * - Alignment with parent unit section's keywords and purpose
     * - EARS format compliance for requirements
     * - Mermaid diagram syntax correctness
     * - Implementation-ready specification quality
     * - Completeness and unambiguity of requirements
     * - No prohibited content (DB schemas, API specs, etc.)
     *
     * For rejected submissions:
     *
     * - Specific syntax errors in Mermaid diagrams
     * - Requirements not in proper EARS format
     * - Prohibited content detected
     * - Vague or ambiguous specifications
     */
    feedback: string;

    /**
     * Revised sections if modifications were made.
     *
     * Only provided if the reviewer made direct corrections. Set to `null` if
     * no revisions were made.
     */
    revisedSections: IRevisedSectionSection[] | null;
  }

  /** Structure for revised sections. */
  export interface IRevisedSectionSection {
    /** Title of the section. */
    title: string;

    /** Revised content. */
    content: string;
  }
}
