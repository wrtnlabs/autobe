import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

/**
 * Application interface for the Minor Section Review agent.
 *
 * This agent is responsible for validating the minor section content
 * produced by the Minor Generation agent, ensuring implementation-ready
 * quality before final document assembly.
 */
export interface IAutoBeAnalyzeWriteMinorReviewApplication {
  /**
   * Process minor section review task or preliminary data requests.
   *
   * Reviews and validates the detailed content within a middle section,
   * ensuring quality standards for EARS format, Mermaid syntax, and
   * overall specification completeness.
   *
   * @param props Request containing either preliminary data request or complete task
   */
  process(props: IAutoBeAnalyzeWriteMinorReviewApplication.IProps): void;
}

export namespace IAutoBeAnalyzeWriteMinorReviewApplication {
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
     * - Are requirements properly formatted in EARS?
     * - Are Mermaid diagrams syntactically correct?
     * - Is the content implementation-ready?
     * - Are there any prohibited contents?
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     */
    request: IComplete | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to complete the minor section review.
   *
   * Provides the review verdict along with feedback and optional revisions.
   * This is the final quality gate before document assembly.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     */
    type: "complete";

    /**
     * Index of the grandparent major section.
     */
    majorIndex: number;

    /**
     * Index of the parent middle section.
     */
    middleIndex: number;

    /**
     * Whether the minor section content passed review.
     *
     * If true: Content is ready for final document assembly.
     * If false: Minor generation must be retried with feedback.
     */
    approved: boolean;

    /**
     * Detailed review feedback.
     *
     * Review criteria evaluated:
     * - Alignment with parent middle section's keywords and purpose
     * - EARS format compliance for requirements
     * - Mermaid diagram syntax correctness
     * - Implementation-ready specification quality
     * - Completeness and unambiguity of requirements
     * - No prohibited content (DB schemas, API specs, etc.)
     *
     * For rejected submissions:
     * - Specific syntax errors in Mermaid diagrams
     * - Requirements not in proper EARS format
     * - Prohibited content detected
     * - Vague or ambiguous specifications
     */
    feedback: string;

    /**
     * Revised minor sections if modifications were made.
     *
     * Only provided if the reviewer made direct corrections.
     */
    revisedSections?: IRevisedMinorSection[];
  }

  /**
   * Structure for revised minor sections.
   */
  export interface IRevisedMinorSection {
    /**
     * Title of the minor section.
     */
    title: string;

    /**
     * Revised content.
     */
    content: string;
  }
}
