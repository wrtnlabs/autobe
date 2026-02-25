import { AutoBeAcquisitionEventBase } from "./base/AutoBeAcquisitionEventBase";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the section (###) generation phase of the hierarchical
 * requirements analysis process.
 *
 * This event represents the third and final step in the hierarchical document
 * generation pipeline where the Analyze Writer Agent creates detailed sections
 * within an approved unit section structure.
 *
 * The Section Agent operates with:
 *
 * - Input: Approved unit section from UnitReviewEvent
 * - Output: Sections with complete detailed content
 *
 * Key characteristics of the section generation process:
 *
 * - Receives confirmed unit section structure as input
 * - Generates detailed requirements using EARS format
 * - Creates Mermaid diagrams where appropriate
 * - Produces implementation-ready specification content
 * - Must be approved by review before final document assembly
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeWriteSectionEvent
  extends
    AutoBeEventBase<"analyzeWriteSection">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase,
    AutoBeAcquisitionEventBase<"previousAnalysisFiles"> {
  /**
   * Index of the grandparent module section.
   *
   * References which module section (0-based) these sections belong to.
   */
  moduleIndex: number;

  /**
   * Index of the parent unit section.
   *
   * References which unit section (0-based) within the module section these
   * sections belong to.
   */
  unitIndex: number;

  /**
   * Array of sections generated for this unit section.
   *
   * Each section represents a detailed subsection (#### level) with complete
   * implementation-ready content.
   */
  sectionSections: AutoBeAnalyzeWriteSectionEvent.ISectionSection[];

  /**
   * Current iteration number of the section generation.
   *
   * Indicates which version is being generated. Increments with each retry
   * after review feedback.
   */
  step: number;

  /**
   * Retry attempt number for this event.
   *
   * Starts at 0 for the first attempt. Increments each time the review rejects
   * and the generation is retried. When retry > 0, completed may exceed total
   * due to repeated work.
   */
  retry: number;
}

export namespace AutoBeAnalyzeWriteSectionEvent {
  /** Structure representing a single section in the document. */
  export interface ISectionSection {
    /** Title of the section (#### level heading). */
    title: string;

    /**
     * Complete content for the section.
     *
     * Contains detailed requirements, specifications, and diagrams. Should use
     * EARS format for requirements and proper Mermaid syntax for any diagrams
     * included.
     */
    content: string;
  }
}
