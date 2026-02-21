import { AutoBeAcquisitionEventBase } from "./base/AutoBeAcquisitionEventBase";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the module section (#) generation phase of the hierarchical
 * requirements analysis process.
 *
 * This event represents the first step in the hierarchical document generation
 * pipeline where the Analyze Writer Agent creates the document's top-level
 * structure including title, summary, and module section outlines.
 *
 * The Module Agent operates as part of the "generate → review" pattern where:
 * 1. Module sections are generated with title, summary, and section purposes
 * 2. Module Review Agent validates the structure before proceeding
 * 3. Only after approval do Unit sections get generated
 *
 * Key characteristics of the module generation process:
 * - Establishes document title and executive summary
 * - Defines module section boundaries and purposes
 * - Creates the foundational structure for subsequent unit/section sections
 * - Must be approved by review before lower-level generation begins
 *
 * @author AutoBE
 */
export interface AutoBeAnalyzeWriteModuleEvent
  extends AutoBeEventBase<"analyzeWriteModule">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase,
    AutoBeAcquisitionEventBase<"previousAnalysisFiles"> {
  /**
   * Document title (# level heading).
   *
   * The main title of the requirements document that will appear at the top
   * of the generated markdown file.
   */
  title: string;

  /**
   * Executive summary of the document.
   *
   * A concise overview (2-3 sentences) describing the purpose and scope
   * of the requirements document.
   */
  summary: string;

  /**
   * Array of module sections defined for this document.
   *
   * Each module section represents a top-level heading (## level) with its
   * title, purpose, and initial content. These sections establish the
   * document's primary structure.
   */
  moduleSections: AutoBeAnalyzeWriteModuleEvent.IModuleSection[];

  /**
   * Current iteration number of the module section generation.
   *
   * Indicates which version of the module structure is being generated.
   * Increments with each retry after review feedback.
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

export namespace AutoBeAnalyzeWriteModuleEvent {
  /**
   * Structure representing a single module section in the document.
   */
  export interface IModuleSection {
    /**
     * Title of the module section (## level heading).
     */
    title: string;

    /**
     * Purpose statement explaining what this section covers.
     *
     * A brief description (1-2 sentences) of the section's role in the
     * overall document structure.
     */
    purpose: string;

    /**
     * Initial content for the module section.
     *
     * Introductory content that appears after the section heading,
     * before any unit sections.
     */
    content: string;
  }
}
