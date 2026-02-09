import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

/**
 * Application interface for the Middle Section (##) generation agent.
 *
 * This agent is responsible for creating middle-level sections within
 * an approved major section structure, defining functional requirement
 * groupings and their content.
 */
export interface IAutoBeAnalyzeWriteMiddleApplication {
  /**
   * Process middle section generation task or preliminary data requests.
   *
   * Creates middle-level sections for a specific major section, including
   * section titles, purposes, content, and keywords for guiding minor
   * section generation.
   *
   * @param props Request containing either preliminary data request or complete task
   */
  process(props: IAutoBeAnalyzeWriteMiddleApplication.IProps): void;
}

export namespace IAutoBeAnalyzeWriteMiddleApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests:
     * - What additional context do you need for this major section?
     * - Why is this information necessary?
     *
     * For completion:
     * - How do the middle sections align with the parent major section?
     * - What functional areas are covered?
     * - Are the keywords appropriate for guiding minor section generation?
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     */
    request: IComplete | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to generate middle section structure.
   *
   * Creates the middle-level hierarchy within a major section, including
   * section definitions with purposes, content, and keywords that will
   * guide minor section generation.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     */
    type: "complete";

    /**
     * Index of the parent major section.
     *
     * References which major section (0-based) these middle sections belong to.
     * This ensures proper alignment with the approved major structure.
     */
    majorIndex: number;

    /**
     * Array of middle sections for this major section.
     *
     * Each middle section represents a subsection (### level) that groups
     * related functionality or requirements. The sections should:
     * - Align with the parent major section's purpose
     * - Have clear functional boundaries
     * - Provide meaningful keywords for minor section guidance
     */
    middleSections: IMiddleSection[];
  }

  /**
   * Structure representing a single middle section.
   */
  export interface IMiddleSection {
    /**
     * Title of the middle section (### level heading).
     *
     * Should clearly indicate the functional area or requirement group
     * covered by this section.
     */
    title: string;

    /**
     * Purpose statement explaining what this section covers.
     *
     * A brief description of the section's role within the parent
     * major section and what requirements it addresses.
     */
    purpose: string;

    /**
     * Content for the middle section.
     *
     * The main body content that appears after the section heading,
     * before any minor sections. Should provide:
     * - Overview of the functional area
     * - Context for the detailed requirements
     * - Relationships to other sections
     */
    content: string;

    /**
     * Keywords that hint at minor section topics.
     *
     * A list of key concepts, features, or requirements that should be
     * detailed in the minor sections. These keywords guide the Minor
     * Agent in generating appropriate detailed content.
     *
     * Example for "User Authentication" middle section:
     * ["login", "registration", "password recovery", "session management"]
     */
    keywords: string[];
  }
}
