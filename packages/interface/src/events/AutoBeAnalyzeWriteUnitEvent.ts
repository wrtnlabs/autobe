import { AutoBeAcquisitionEventBase } from "./base/AutoBeAcquisitionEventBase";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the unit section (##) generation phase of the hierarchical
 * requirements analysis process.
 *
 * This event represents the second step in the hierarchical document generation
 * pipeline where the Analyze Writer Agent creates unit-level sections within
 * an approved module section structure.
 *
 * The Unit Agent operates with:
 * - Input: Approved module section from ModuleReviewEvent
 * - Output: Unit sections with titles, purposes, content, and keywords
 *
 * Key characteristics of the unit generation process:
 * - Receives confirmed module section structure as input
 * - Generates functional requirement groupings
 * - Defines unit section boundaries and purposes
 * - Provides keywords as hints for section generation
 * - Must be approved by review before sections are generated
 *
 * @author AutoBE
 */
export interface AutoBeAnalyzeWriteUnitEvent
  extends AutoBeEventBase<"analyzeWriteUnit">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase,
    AutoBeAcquisitionEventBase<"previousAnalysisFiles"> {
  /**
   * Index of the parent module section.
   *
   * References which module section (0-based) these unit sections belong to.
   */
  moduleIndex: number;

  /**
   * Array of unit sections generated for this module section.
   *
   * Each unit section represents a subsection (### level) with its
   * title, purpose, content, and keywords for guiding section generation.
   */
  unitSections: AutoBeAnalyzeWriteUnitEvent.IUnitSection[];

  /**
   * Current iteration number of the unit section generation.
   *
   * Indicates which version is being generated. Increments with each
   * retry after review feedback.
   */
  step: number;

  /**
   * Retry attempt number for this event.
   *
   * Starts at 0 for the first attempt. Increments each time the review
   * rejects and the generation is retried. When retry > 0, completed may
   * exceed total due to repeated work.
   */
  retry: number;
}

export namespace AutoBeAnalyzeWriteUnitEvent {
  /**
   * Structure representing a single unit section in the document.
   */
  export interface IUnitSection {
    /**
     * Title of the unit section (### level heading).
     */
    title: string;

    /**
     * Purpose statement explaining what this section covers.
     *
     * A brief description of the section's role within the parent
     * module section.
     */
    purpose: string;

    /**
     * Content for the unit section.
     *
     * The main body content that appears after the section heading,
     * before any sections.
     */
    content: string;

    /**
     * Keywords that hint at section topics.
     *
     * Used by the Section Agent to understand what detailed topics
     * should be covered within this unit section.
     */
    keywords: string[];
  }
}
