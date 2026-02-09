import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

/**
 * Application interface for the Minor Section (###) generation agent.
 *
 * This agent is responsible for creating detailed minor sections within
 * an approved middle section structure, producing implementation-ready
 * requirement specifications.
 */
export interface IAutoBeAnalyzeWriteMinorApplication {
  /**
   * Process minor section generation task or preliminary data requests.
   *
   * Creates detailed minor sections for a specific middle section,
   * including complete content with EARS format requirements and
   * Mermaid diagrams where appropriate.
   *
   * @param props Request containing either preliminary data request or complete task
   */
  process(props: IAutoBeAnalyzeWriteMinorApplication.IProps): void;
}

export namespace IAutoBeAnalyzeWriteMinorApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests:
     * - What additional context do you need for detailed content?
     *
     * For completion:
     * - How do the minor sections address the keywords from the middle section?
     * - Are requirements specific and in EARS format where appropriate?
     * - Are Mermaid diagrams properly formatted?
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     */
    request: IComplete | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to generate minor section content.
   *
   * Creates the detailed content within a middle section, including
   * implementation-ready requirements specifications with proper
   * formatting and diagrams.
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
     * Array of minor sections for this middle section.
     *
     * Each minor section represents a detailed subsection (#### level)
     * containing specific requirements, specifications, or process
     * descriptions. The content should:
     * - Use EARS format for requirements where appropriate
     * - Include Mermaid diagrams with proper syntax
     * - Be specific and implementation-ready
     * - Avoid prohibited content (DB schemas, API specs)
     */
    minorSections: IMinorSection[];
  }

  /**
   * Structure representing a single minor section.
   */
  export interface IMinorSection {
    /**
     * Title of the minor section (#### level heading).
     *
     * Should clearly indicate the specific requirement, process,
     * or feature being detailed.
     */
    title: string;

    /**
     * Complete content for the minor section.
     *
     * Contains detailed requirements, specifications, and diagrams.
     * Content guidelines:
     *
     * EARS Format for Requirements:
     * - Ubiquitous: "THE <system> SHALL <function>"
     * - Event-driven: "WHEN <trigger>, THE <system> SHALL <function>"
     * - State-driven: "WHILE <state>, THE <system> SHALL <function>"
     * - Unwanted: "IF <condition>, THEN THE <system> SHALL <function>"
     * - Optional: "WHERE <feature>, THE <system> SHALL <function>"
     *
     * Mermaid Diagram Rules:
     * - ALL labels must use double quotes: A["User Login"]
     * - NO spaces between brackets and quotes
     * - Arrow syntax: --> (NOT --|)
     * - LR orientation preferred for flowcharts
     *
     * Prohibited Content:
     * - Database schemas or ERD
     * - API endpoint specifications
     * - Technical implementation details
     * - Frontend UI/UX specifications
     */
    content: string;
  }
}
