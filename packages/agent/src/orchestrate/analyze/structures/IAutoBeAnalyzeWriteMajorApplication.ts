import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

/**
 * Application interface for the Major Section (#) generation agent.
 *
 * This agent is responsible for creating the top-level document structure
 * including title, summary, and major section outlines in the hierarchical
 * requirements documentation process.
 */
export interface IAutoBeAnalyzeWriteMajorApplication {
  /**
   * Process major section generation task or preliminary data requests.
   *
   * Creates the document's top-level structure including title, summary,
   * and major section definitions that will guide subsequent middle and
   * minor section generation.
   *
   * @param props Request containing either preliminary data request or complete task
   */
  process(props: IAutoBeAnalyzeWriteMajorApplication.IProps): void;
}

export namespace IAutoBeAnalyzeWriteMajorApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getPreviousAnalysisFiles):
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     * - What document structure have you designed?
     * - Why is this structure appropriate for the requirements?
     * - Summarize the major sections and their purposes.
     *
     * This reflection helps you avoid duplicate requests and premature completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles, getPreviousAnalysisFiles) or major section generation
     * (complete). When preliminary returns empty array, that type is removed
     * from the union, physically preventing repeated calls.
     */
    request: IComplete | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to generate major section structure.
   *
   * Creates the document's top-level hierarchy including title, executive summary,
   * and major section definitions. This structure must be approved by the review
   * agent before middle section generation begins.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Value "complete" indicates this is the final task execution request.
     */
    type: "complete";

    /**
     * Document title (# level heading).
     *
     * The main title of the requirements document. Should be clear, concise,
     * and accurately reflect the document's scope and purpose.
     *
     * Example: "E-Commerce Platform Requirements Specification"
     */
    title: string;

    /**
     * Executive summary of the document.
     *
     * A concise overview (2-3 sentences) describing:
     * - The purpose of this requirements document
     * - The scope of the system being specified
     * - The primary business objectives
     *
     * This summary helps readers quickly understand the document's context
     * before diving into detailed sections.
     */
    summary: string;

    /**
     * Array of major sections defined for this document.
     *
     * Each major section represents a top-level heading (## level) that
     * organizes related requirements and functionality. The sections should:
     * - Cover all aspects of the system requirements
     * - Have clear, non-overlapping boundaries
     * - Be ordered logically (overview → features → constraints)
     *
     * Typical major sections include:
     * - Business Model & User Actors
     * - Functional Requirements
     * - Non-Functional Requirements
     * - Security Requirements
     * - Business Rules & Policies
     */
    majorSections: IMajorSection[];
  }

  /**
   * Structure representing a single major section.
   */
  export interface IMajorSection {
    /**
     * Title of the major section (## level heading).
     *
     * Should be descriptive and indicate the section's focus area.
     */
    title: string;

    /**
     * Purpose statement explaining what this section covers.
     *
     * A brief description (1-2 sentences) of the section's role in the
     * overall document structure. This helps the review agent and subsequent
     * generation stages understand the intended scope.
     */
    purpose: string;

    /**
     * Initial content for the major section.
     *
     * Introductory content that appears after the section heading,
     * before any middle sections. Should provide context and overview
     * for the topics covered in this major section.
     */
    content: string;
  }
}
