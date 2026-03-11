import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";

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
   * content with Mermaid diagrams and, for requirement-heavy files
   * (03-functional-requirements, 04-business-rules), EARS format requirements.
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
   * - For 03/04 files: Are requirements specific and in EARS format?
   * - For other files: Is content written in clear, descriptive prose?
   * - Are Mermaid diagrams properly formatted?
   */
  thinking?: string | null;

  /** Type discriminator for the request. */
  request:
    | IAutoBeAnalyzeWriteSectionApplicationComplete
    | IAutoBePreliminaryGetPreviousAnalysisSections;
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
   * - Use EARS format for requirements in 03-functional-requirements and
   *   04-business-rules files; use natural language prose for other files
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
   * EARS Format (ONLY for 03-functional-requirements, 04-business-rules):
   *
   * - Ubiquitous: "THE <system> SHALL <function>"
   * - Event-driven: "WHEN <trigger>, THE <system> SHALL <function>"
   * - State-driven: "WHILE <state>, THE <system> SHALL <function>"
   * - Unwanted: "IF <condition>, THEN THE <system> SHALL <function>"
   * - Optional: "WHERE <feature>, THE <system> SHALL <function>"
   *
   * Natural Language (for 00-toc, 01-actors-and-auth, 02-domain-model,
   * 05-non-functional):
   *
   * - Use clear, descriptive prose for definitions, concepts, and policies
   * - Focus on readability over formal structure
   * - Tables and bullet points are preferred for structured data
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
   *
   * Hallucination Prevention:
   *
   * - Every requirement must trace to the original user input
   * - Do NOT invent SLA numbers, timeout values, or performance targets
   * - Do NOT add security mechanisms (2FA, JWT, encryption) user did not mention
   * - Do NOT add infrastructure requirements (CDN, caching) user did not mention
   * - 05-non-functional: only describe aspects the user explicitly mentioned
   *
   * Conciseness:
   *
   * - One concept = one section, not multiple sections rephrasing the same idea
   * - 02-domain-model: max 1-3 sections per business concept
   */
  content: string;
}
