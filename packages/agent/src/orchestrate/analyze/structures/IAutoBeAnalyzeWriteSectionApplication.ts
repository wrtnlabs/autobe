import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

/**
 * Application interface for the Section (###) generation agent.
 *
 * This agent is responsible for creating detailed sections within an approved
 * unit section structure, producing implementation-ready requirement
 * specifications.
 */
export interface IAutoBeAnalyzeWriteSectionApplication {
  /**
   * Process section generation task or preliminary data requests.
   *
   * Creates detailed sections for a specific unit section, including complete
   * content with EARS format requirements and Mermaid diagrams where
   * appropriate.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeAnalyzeWriteSectionApplicationProps): void;
}

export interface IAutoBeAnalyzeWriteSectionApplicationProps {
  /**
   * Think before you act.
   *
   * Before requesting preliminary data or completing your task, reflect on your
   * current state and explain your reasoning:
   *
   * For preliminary requests:
   *
   * - What additional context do you need for detailed content?
   *
   * For completion:
   *
   * - How do the sections address the keywords from the unit section?
   * - Are requirements specific and in EARS format where appropriate?
   * - Are Mermaid diagrams properly formatted?
   */
  thinking?: string | null;

  /** Type discriminator for the request. */
  request:
    | IAutoBeAnalyzeWriteSectionApplicationComplete
    | IAutoBePreliminaryGetPreviousAnalysisFiles;
}

/**
 * Request to generate section content.
 *
 * Creates the detailed content within a unit section, including
 * implementation-ready requirements specifications with proper formatting and
 * diagrams.
 */
export interface IAutoBeAnalyzeWriteSectionApplicationComplete {
  /** Type discriminator for the request. */
  type: "complete";

  /** Index of the grandparent module section. */
  moduleIndex: number;

  /** Index of the parent unit section. */
  unitIndex: number;

  /**
   * Array of sections for this unit section.
   *
   * Each section represents a detailed subsection (#### level) containing
   * specific requirements, specifications, or process descriptions. The content
   * should:
   *
   * - Use EARS format for requirements where appropriate
   * - Include Mermaid diagrams with proper syntax
   * - Be specific and implementation-ready
   * - Avoid prohibited content (DB schemas, API specs)
   */
  sectionSections: IAutoBeAnalyzeWriteSectionApplicationSectionSection[];
}

/** Structure representing a single section. */
export interface IAutoBeAnalyzeWriteSectionApplicationSectionSection {
  /**
   * Title of the section (#### level heading).
   *
   * Should clearly indicate the specific requirement, process, or feature being
   * detailed.
   */
  title: string;

  /**
   * Complete content for the section.
   *
   * Contains detailed requirements, specifications, and diagrams. Content
   * guidelines:
   *
   * EARS Format for Requirements:
   *
   * - Ubiquitous: "THE <system> SHALL <function>"
   * - Event-driven: "WHEN <trigger>, THE <system> SHALL <function>"
   * - State-driven: "WHILE <state>, THE <system> SHALL <function>"
   * - Unwanted: "IF <condition>, THEN THE <system> SHALL <function>"
   * - Optional: "WHERE <feature>, THE <system> SHALL <function>"
   *
   * Mermaid Diagram Rules:
   *
   * - ALL labels must use double quotes: A["User Login"]
   * - NO spaces between brackets and quotes
   * - Arrow syntax: --> (NOT --|)
   * - LR orientation preferred for flowcharts
   *
   * Prohibited Content:
   *
   * - Database schemas or ERD
   * - API endpoint specifications
   * - Technical implementation details
   * - Frontend UI/UX specifications
   */
  content: string;
}
