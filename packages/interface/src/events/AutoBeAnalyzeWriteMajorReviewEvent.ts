import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";
import { AutoBeAnalyzeWriteMajorEvent } from "./AutoBeAnalyzeWriteMajorEvent";

/**
 * Event fired during the review phase of major section (#) generation.
 *
 * This event represents the quality assurance step in the hierarchical document
 * generation pipeline. The Major Review Agent validates the document structure
 * produced by the Major Agent before allowing progression to middle section
 * generation.
 *
 * Review criteria include:
 * - Document title appropriateness and clarity
 * - Summary completeness and accuracy
 * - Major section coverage (all required topics included)
 * - Section purposes are clear and non-overlapping
 * - Logical organization of sections
 *
 * Review outcomes:
 * - **Approved**: Structure is valid, proceed to middle section generation
 * - **Rejected**: Structure needs revision, provide specific feedback
 *
 * @author AutoBE
 */
export interface AutoBeAnalyzeWriteMajorReviewEvent
  extends AutoBeEventBase<"analyzeWriteMajorReview">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Whether the major section structure passed review.
   *
   * If true, the middle section generation can proceed.
   * If false, the major generation must be retried with feedback.
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
   * Revised major sections if modifications were made during review.
   *
   * If the reviewer made direct corrections to the structure,
   * this field contains the updated sections. Otherwise undefined.
   */
  revisedSections?: AutoBeAnalyzeWriteMajorEvent.IMajorSection[];

  /**
   * Revised title if modified during review.
   */
  revisedTitle?: string;

  /**
   * Revised summary if modified during review.
   */
  revisedSummary?: string;

  /**
   * Current iteration number of the review process.
   *
   * Tracks how many review cycles have been completed for this document.
   */
  step: number;
}
