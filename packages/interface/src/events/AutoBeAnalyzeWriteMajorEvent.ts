import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the major section (#) generation phase of the hierarchical
 * requirements analysis process.
 *
 * This event represents the first step in the hierarchical document generation
 * pipeline where the Analyze Writer Agent creates the document's top-level
 * structure including title, summary, and major section outlines.
 *
 * The Major Agent operates as part of the "generate → review" pattern where:
 * 1. Major sections are generated with title, summary, and section purposes
 * 2. Major Review Agent validates the structure before proceeding
 * 3. Only after approval do Middle sections get generated
 *
 * Key characteristics of the major generation process:
 * - Establishes document title and executive summary
 * - Defines major section boundaries and purposes
 * - Creates the foundational structure for subsequent middle/minor sections
 * - Must be approved by review before lower-level generation begins
 *
 * @author AutoBE
 */
export interface AutoBeAnalyzeWriteMajorEvent
  extends AutoBeEventBase<"analyzeWriteMajor">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
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
   * Array of major sections defined for this document.
   *
   * Each major section represents a top-level heading (## level) with its
   * title, purpose, and initial content. These sections establish the
   * document's primary structure.
   */
  majorSections: AutoBeAnalyzeWriteMajorEvent.IMajorSection[];

  /**
   * Current iteration number of the major section generation.
   *
   * Indicates which version of the major structure is being generated.
   * Increments with each retry after review feedback.
   */
  step: number;
}

export namespace AutoBeAnalyzeWriteMajorEvent {
  /**
   * Structure representing a single major section in the document.
   */
  export interface IMajorSection {
    /**
     * Title of the major section (## level heading).
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
     * Initial content for the major section.
     *
     * Introductory content that appears after the section heading,
     * before any middle sections.
     */
    content: string;
  }
}
