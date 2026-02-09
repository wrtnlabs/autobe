import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the middle section (##) generation phase of the hierarchical
 * requirements analysis process.
 *
 * This event represents the second step in the hierarchical document generation
 * pipeline where the Analyze Writer Agent creates middle-level sections within
 * an approved major section structure.
 *
 * The Middle Agent operates with:
 * - Input: Approved major section from MajorReviewEvent
 * - Output: Middle sections with titles, purposes, content, and keywords
 *
 * Key characteristics of the middle generation process:
 * - Receives confirmed major section structure as input
 * - Generates functional requirement groupings
 * - Defines middle section boundaries and purposes
 * - Provides keywords as hints for minor section generation
 * - Must be approved by review before minor sections are generated
 *
 * @author AutoBE
 */
export interface AutoBeAnalyzeWriteMiddleEvent
  extends AutoBeEventBase<"analyzeWriteMiddle">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Index of the parent major section.
   *
   * References which major section (0-based) these middle sections belong to.
   */
  majorIndex: number;

  /**
   * Array of middle sections generated for this major section.
   *
   * Each middle section represents a subsection (### level) with its
   * title, purpose, content, and keywords for guiding minor generation.
   */
  middleSections: AutoBeAnalyzeWriteMiddleEvent.IMiddleSection[];

  /**
   * Current iteration number of the middle section generation.
   *
   * Indicates which version is being generated. Increments with each
   * retry after review feedback.
   */
  step: number;
}

export namespace AutoBeAnalyzeWriteMiddleEvent {
  /**
   * Structure representing a single middle section in the document.
   */
  export interface IMiddleSection {
    /**
     * Title of the middle section (### level heading).
     */
    title: string;

    /**
     * Purpose statement explaining what this section covers.
     *
     * A brief description of the section's role within the parent
     * major section.
     */
    purpose: string;

    /**
     * Content for the middle section.
     *
     * The main body content that appears after the section heading,
     * before any minor sections.
     */
    content: string;

    /**
     * Keywords that hint at minor section topics.
     *
     * Used by the Minor Agent to understand what detailed topics
     * should be covered within this middle section.
     */
    keywords: string[];
  }
}
