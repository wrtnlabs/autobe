import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

/**
 * Application interface for the Batch Section Review agent.
 *
 * This agent reviews ALL section sections for a file in a single LLM call,
 * providing holistic review of the entire file's detailed content.
 */
export interface IAutoBeAnalyzeWriteAllSectionReviewApplication {
  /**
   * Process batch section review task or preliminary data requests.
   *
   * Reviews and validates ALL section sections across all units in a single
   * call, ensuring consistency and proper coverage.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeAnalyzeWriteAllSectionReviewApplication.IProps): void;
}

export namespace IAutoBeAnalyzeWriteAllSectionReviewApplication {
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
     * - Are ALL requirements properly formatted in EARS?
     * - Are Mermaid diagrams syntactically correct throughout?
     * - Is the content implementation-ready across all sections?
     * - Are there any prohibited contents in any section?
     */
    thinking: string;

    /** Type discriminator for the request. */
    request: IComplete | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to complete the batch section review.
   *
   * Provides the overall review verdict for ALL sections in the file.
   */
  export interface IComplete {
    /** Type discriminator for the request. */
    type: "complete";

    /**
     * Whether ALL sections passed review.
     *
     * If true: Content is ready for final document assembly. If false: ALL
     * section generation must be retried with feedback.
     */
    approved: boolean;

    /**
     * Detailed review feedback covering the entire file's section content.
     *
     * Review criteria evaluated:
     *
     * - Alignment with parent unit section's keywords and purpose
     * - EARS format compliance for requirements
     * - Mermaid diagram syntax correctness
     * - Implementation-ready specification quality
     * - Completeness and unambiguity of requirements
     * - No prohibited content (DB schemas, API specs, etc.)
     * - Consistency across all sections
     *
     * For rejected submissions:
     *
     * - Specific syntax errors (with location)
     * - Requirements not in proper EARS format
     * - Prohibited content detected
     * - Vague or ambiguous specifications
     */
    feedback: string;

    /**
     * Revised sections for ALL units if modifications were made.
     *
     * Only provided if the reviewer made direct corrections. Organized by
     * module index and unit index. Set to `null` if no revisions were made.
     */
    revisedSections: IRevisedModuleSections[] | null;
  }

  /** Structure for revised sections of a single module. */
  export interface IRevisedModuleSections {
    /** Index of the module section. */
    moduleIndex: number;

    /** Revised sections for each unit in this module. */
    units: IRevisedUnitSections[];
  }

  /** Structure for revised sections of a single unit. */
  export interface IRevisedUnitSections {
    /** Index of the unit section. */
    unitIndex: number;

    /** Revised section sections for this unit. */
    sectionSections: IRevisedSectionSection[];
  }

  /** Structure for a revised section. */
  export interface IRevisedSectionSection {
    /** Title of the section. */
    title: string;

    /** Revised content. */
    content: string;
  }
}
