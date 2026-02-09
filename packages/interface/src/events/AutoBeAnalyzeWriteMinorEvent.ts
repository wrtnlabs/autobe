import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the minor section (###) generation phase of the hierarchical
 * requirements analysis process.
 *
 * This event represents the third and final step in the hierarchical document
 * generation pipeline where the Analyze Writer Agent creates detailed minor
 * sections within an approved middle section structure.
 *
 * The Minor Agent operates with:
 * - Input: Approved middle section from MiddleReviewEvent
 * - Output: Minor sections with complete detailed content
 *
 * Key characteristics of the minor generation process:
 * - Receives confirmed middle section structure as input
 * - Generates detailed requirements using EARS format
 * - Creates Mermaid diagrams where appropriate
 * - Produces implementation-ready specification content
 * - Must be approved by review before final document assembly
 *
 * @author AutoBE
 */
export interface AutoBeAnalyzeWriteMinorEvent
  extends AutoBeEventBase<"analyzeWriteMinor">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Index of the grandparent major section.
   *
   * References which major section (0-based) these minor sections belong to.
   */
  majorIndex: number;

  /**
   * Index of the parent middle section.
   *
   * References which middle section (0-based) within the major section
   * these minor sections belong to.
   */
  middleIndex: number;

  /**
   * Array of minor sections generated for this middle section.
   *
   * Each minor section represents a detailed subsection (#### level)
   * with complete implementation-ready content.
   */
  minorSections: AutoBeAnalyzeWriteMinorEvent.IMinorSection[];

  /**
   * Current iteration number of the minor section generation.
   *
   * Indicates which version is being generated. Increments with each
   * retry after review feedback.
   */
  step: number;
}

export namespace AutoBeAnalyzeWriteMinorEvent {
  /**
   * Structure representing a single minor section in the document.
   */
  export interface IMinorSection {
    /**
     * Title of the minor section (#### level heading).
     */
    title: string;

    /**
     * Complete content for the minor section.
     *
     * Contains detailed requirements, specifications, and diagrams.
     * Should use EARS format for requirements and proper Mermaid
     * syntax for any diagrams included.
     */
    content: string;
  }
}
