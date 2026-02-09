import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";
import { AutoBeAnalyzeWriteMiddleEvent } from "./AutoBeAnalyzeWriteMiddleEvent";

/**
 * Event fired during the review phase of middle section (##) generation.
 *
 * This event represents the quality assurance step for middle sections in
 * the hierarchical document generation pipeline. The Middle Review Agent
 * validates the middle section structure before allowing progression to
 * minor section generation.
 *
 * Review criteria include:
 * - Alignment with parent major section's purpose
 * - Completeness of functional requirement coverage
 * - Non-overlapping section boundaries
 * - Appropriate granularity for the document's scope
 * - Keywords adequately represent minor section topics
 *
 * Review outcomes:
 * - **Approved**: Structure is valid, proceed to minor section generation
 * - **Rejected**: Structure needs revision, provide specific feedback
 *
 * @author AutoBE
 */
export interface AutoBeAnalyzeWriteMiddleReviewEvent
  extends AutoBeEventBase<"analyzeWriteMiddleReview">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Index of the parent major section being reviewed.
   */
  majorIndex: number;

  /**
   * Whether the middle section structure passed review.
   *
   * If true, the minor section generation can proceed.
   * If false, the middle generation must be retried with feedback.
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
   * Revised middle sections if modifications were made during review.
   *
   * If the reviewer made direct corrections to the structure,
   * this field contains the updated sections. Otherwise undefined.
   */
  revisedSections?: AutoBeAnalyzeWriteMiddleEvent.IMiddleSection[];

  /**
   * Current iteration number of the review process.
   *
   * Tracks how many review cycles have been completed for this
   * major section's middle content.
   */
  step: number;
}
