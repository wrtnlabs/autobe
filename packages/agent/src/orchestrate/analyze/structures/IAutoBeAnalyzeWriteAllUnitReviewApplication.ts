import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

/**
 * Application interface for the Batch Unit Section Review agent.
 *
 * This agent reviews ALL unit sections for a file in a single LLM call,
 * providing holistic review of the entire file's unit structure.
 */
export interface IAutoBeAnalyzeWriteAllUnitReviewApplication {
  /**
   * Process batch unit section review task or preliminary data requests.
   *
   * Reviews and validates ALL unit sections across all module sections in a
   * single call, ensuring consistency and proper coverage.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeAnalyzeWriteAllUnitReviewApplication.IProps): void;
}

export namespace IAutoBeAnalyzeWriteAllUnitReviewApplication {
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
     * - How well do ALL unit sections align with their parent module sections?
     * - Is there consistency across the entire file's structure?
     * - Are all functional requirements covered without overlap?
     */
    thinking: string;

    /** Type discriminator for the request. */
    request: IComplete | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to complete the batch unit section review.
   *
   * Provides the overall review verdict for ALL units in the file.
   */
  export interface IComplete {
    /** Type discriminator for the request. */
    type: "complete";

    /**
     * Whether ALL unit sections passed review.
     *
     * If true: Section generation can proceed for all units. If false: ALL unit
     * generation must be retried with feedback.
     */
    approved: boolean;

    /**
     * Detailed review feedback covering the entire file's unit structure.
     *
     * Review criteria evaluated:
     *
     * - Alignment of each unit section with its parent module section
     * - Consistency across all units in the file
     * - Completeness of functional requirement coverage
     * - Non-overlapping section boundaries
     * - Appropriate granularity for the document's scope
     * - Keywords adequately represent section topics
     *
     * For rejected submissions:
     *
     * - Specific issues identified (with module indices)
     * - Actionable recommendations for improvement
     * - Missing functional areas
     */
    feedback: string;

    /**
     * Revised unit sections for ALL modules if modifications were made.
     *
     * Only provided if the reviewer made direct corrections. Array index
     * corresponds to moduleIndex. Set to `null` if no revisions were made.
     */
    revisedUnits: IRevisedModuleUnit[] | null;
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
