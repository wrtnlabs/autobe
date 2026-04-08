import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";

/**
 * Application interface for the Section (###) generation agent.
 *
 * Combines preliminary context loading, section submission, and iterative
 * correction into a single unified loop.
 */
export interface IAutoBeAnalyzeWriteSectionApplication {
  /**
   * Process section generation, write submission, or preliminary data requests.
   *
   * Submit section content via `write`, then review your own output. Call
   * `complete` if satisfied, or submit another `write` to improve (3 writes
   * maximum).
   *
   * @param props Request containing preliminary data request, write submission,
   *   or completion signal
   */
  process(props: IAutoBeAnalyzeWriteSectionApplication.IProps): void;
}
export namespace IAutoBeAnalyzeWriteSectionApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests:
     *
     * - What additional context do you need for detailed content?
     *
     * For write submissions:
     *
     * - If this is an initial write, summarize your plan.
     * - If this is a revision, what issues are you improving and how?
     *
     * For complete:
     *
     * - State why you consider the last write final.
     */
    thinking?: string | null;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union.
     */
    request:
      | IWrite
      | IAutoBePreliminaryComplete
      | IAutoBePreliminaryGetPreviousAnalysisSections;
  }

  /**
   * Submit section content for review.
   *
   * The submitted content should use English-only text, technology-neutral
   * language, and correct entity references.
   */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /** Index of the grandparent module section. */
    moduleIndex: number;

    /** Index of the parent unit section. */
    unitIndex: number;

    /**
     * Array of sections for this unit section.
     *
     * Each section represents a detailed subsection (#### level) containing
     * specific requirements, specifications, or process descriptions. The
     * content should:
     *
     * - Use EARS format for requirements in 03-functional-requirements and
     *   04-business-rules files; use natural language prose for other files
     * - Include Mermaid diagrams with proper syntax
     * - Be specific and implementation-ready
     * - Avoid prohibited content (DB schemas, API specs)
     */
    sectionSections: ISectionOfSection[];
  }

  /** Structure representing a single section. */
  export interface ISectionOfSection {
    /**
     * Title of the section (#### level heading).
     *
     * Should clearly indicate the specific requirement, process, or feature
     * being detailed.
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
     * - Do NOT add security mechanisms (2FA, JWT, encryption) user did not
     *   mention
     * - Do NOT add infrastructure requirements (CDN, caching) user did not
     *   mention
     * - 05-non-functional: only describe aspects the user explicitly mentioned
     *
     * Conciseness:
     *
     * - One concept = one section, not multiple sections rephrasing the same idea
     * - 02-domain-model: max 1-3 sections per business concept
     */
    content: string;
  }
}
