import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";

/**
 * Application interface for the Unit Section (##) generation agent.
 *
 * This agent is responsible for creating unit-level sections within an approved
 * module section structure, defining functional requirement groupings and their
 * content.
 */
export interface IAutoBeAnalyzeWriteUnitApplication {
  /**
   * Process unit section generation task or preliminary data requests.
   *
   * Creates unit-level sections for a specific module section, including
   * section titles, purposes, content, and keywords for guiding section
   * generation.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeAnalyzeWriteUnitApplicationProps): void;
}

export interface IAutoBeAnalyzeWriteUnitApplicationProps {
  /**
   * Think before you act.
   *
   * Before requesting preliminary data or completing your task, reflect on your
   * current state and explain your reasoning:
   *
   * For preliminary requests:
   *
   * - What additional context do you need for this module section?
   * - Why is this information necessary?
   *
   * For completion:
   *
   * - How do the unit sections align with the parent module section?
   * - What functional areas are covered?
   * - Are the keywords appropriate for guiding section generation?
   */
  thinking?: string | null;

  /** Type discriminator for the request. */
  request:
    | IAutoBeAnalyzeWriteUnitApplicationComplete
    | IAutoBePreliminaryGetPreviousAnalysisSections;
}

/**
 * Request to generate unit section structure.
 *
 * Creates the unit-level hierarchy within a module section, including section
 * definitions with purposes, content, and keywords that will guide section
 * generation.
 */
export interface IAutoBeAnalyzeWriteUnitApplicationComplete {
  /** Type discriminator for the request. */
  type: "complete";

  /**
   * Index of the parent module section.
   *
   * References which module section (0-based) these unit sections belong to.
   * This ensures proper alignment with the approved module structure.
   */
  moduleIndex: number;

  /**
   * Array of unit sections for this module section.
   *
   * Each unit section represents a subsection (### level) that groups related
   * functionality or requirements. The sections should:
   *
   * - Align with the parent module section's purpose
   * - Have clear functional boundaries
   * - Provide meaningful keywords for section guidance
   */
  unitSections: IAutoBeAnalyzeWriteUnitApplicationUnitSection[];
}

/** Structure representing a single unit section. */
export interface IAutoBeAnalyzeWriteUnitApplicationUnitSection {
  /**
   * Title of the unit section (### level heading).
   *
   * Should clearly indicate the functional area or requirement group covered by
   * this section.
   */
  title: string;

  /**
   * Purpose statement explaining what this section covers.
   *
   * A brief description of the section's role within the parent module section
   * and what requirements it addresses.
   */
  purpose: string;

  /**
   * Content for the unit section.
   *
   * The main body content that appears after the section heading, before any
   * sections. Should provide:
   *
   * - Overview of the functional area
   * - Context for the detailed requirements
   * - Relationships to other sections
   */
  content: string;

  /**
   * Keywords that hint at section topics.
   *
   * A list of key concepts, features, or requirements that should be detailed
   * in the sections. These keywords guide the Section Agent in generating
   * appropriate detailed content.
   *
   * Example for "User Authentication" unit section: ["login", "registration",
   * "password recovery", "session management"]
   */
  keywords: string[];
}
