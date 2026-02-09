import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";
import { AutoBeAnalyzeWriteMinorEvent } from "./AutoBeAnalyzeWriteMinorEvent";

/**
 * Event fired during the review phase of minor section (###) generation.
 *
 * This event represents the final quality assurance step in the hierarchical
 * document generation pipeline. The Minor Review Agent validates the detailed
 * content before final document assembly.
 *
 * Review criteria include:
 * - Alignment with parent middle section's keywords and purpose
 * - EARS format compliance for requirements
 * - Mermaid diagram syntax correctness
 * - Implementation-ready specification quality
 * - Completeness and unambiguity of requirements
 * - No prohibited content (database schemas, API specs, etc.)
 *
 * Review outcomes:
 * - **Approved**: Content is valid, ready for document assembly
 * - **Rejected**: Content needs revision, provide specific feedback
 *
 * @author AutoBE
 */
export interface AutoBeAnalyzeWriteMinorReviewEvent
  extends AutoBeEventBase<"analyzeWriteMinorReview">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Index of the grandparent major section being reviewed.
   */
  majorIndex: number;

  /**
   * Index of the parent middle section being reviewed.
   */
  middleIndex: number;

  /**
   * Whether the minor section content passed review.
   *
   * If true, the content is ready for final document assembly.
   * If false, the minor generation must be retried with feedback.
   */
  approved: boolean;

  /**
   * Detailed review feedback.
   *
   * Contains specific validation results and recommendations.
   * If approved, may contain minor suggestions for future reference.
   * If rejected, contains actionable feedback for revision.
   */
  feedback: string;

  /**
   * Revised minor sections if modifications were made during review.
   *
   * If the reviewer made direct corrections to the content,
   * this field contains the updated sections. Otherwise undefined.
   */
  revisedSections?: AutoBeAnalyzeWriteMinorEvent.IMinorSection[];

  /**
   * Current iteration number of the review process.
   *
   * Tracks how many review cycles have been completed for this
   * middle section's minor content.
   */
  step: number;
}
