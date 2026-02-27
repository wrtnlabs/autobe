import { AutoBeAnalyzeSection } from "./AutoBeAnalyzeSection";

/**
 * Interface representing a unit (## level) within a module section of an
 * analysis document.
 *
 * Units represent functional groupings within a module, containing detailed
 * requirements and specifications. Each unit has its own sections (### level)
 * that provide implementation-ready content.
 *
 * The keywords property is particularly important as it provides semantic hints
 * about the topics covered, enabling intelligent search and categorization of
 * requirements.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeUnit {
  /** Title of the unit (## level heading). */
  title: string;

  /**
   * Purpose statement explaining what this unit covers.
   *
   * A brief description of the unit's role within the parent module.
   */
  purpose: string;

  /**
   * Content for the unit.
   *
   * The main body content that appears after the heading, before any sections.
   */
  content: string;

  /**
   * Keywords that describe the topics covered in this unit.
   *
   * These keywords provide semantic hints for:
   *
   * - Guiding section generation with topic focus
   * - Enabling keyword-based search and filtering
   * - Categorizing requirements by domain concepts
   */
  keywords: string[];

  /**
   * Array of sections (### level) within this unit.
   *
   * Each section contains detailed requirements, specifications, and diagrams
   * that form the implementation-ready content.
   */
  sections: AutoBeAnalyzeSection[];
}
