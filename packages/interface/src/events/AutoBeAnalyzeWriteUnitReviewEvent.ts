import { AutoBeAnalyzeWriteUnitEvent } from "./AutoBeAnalyzeWriteUnitEvent";
import { AutoBeAcquisitionEventBase } from "./base/AutoBeAcquisitionEventBase";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the review phase of unit section (##) generation.
 *
 * This event represents the quality assurance step for unit sections in the
 * hierarchical document generation pipeline. The Unit Review Agent validates
 * the unit section structure before allowing progression to section
 * generation.
 *
 * Review criteria include:
 *
 * - Alignment with parent module section's purpose
 * - Completeness of functional requirement coverage
 * - Non-overlapping section boundaries
 * - Appropriate granularity for the document's scope
 * - Keywords adequately represent section topics
 *
 * Review outcomes:
 *
 * - **Approved**: Structure is valid, proceed to section generation
 * - **Rejected**: Structure needs revision, provide specific feedback
 *
 * @author AutoBE
 */
export interface AutoBeAnalyzeWriteUnitReviewEvent
  extends
    AutoBeEventBase<"analyzeWriteUnitReview">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase,
    AutoBeAcquisitionEventBase<"previousAnalysisFiles"> {
  /** Index of the parent module section being reviewed. */
  moduleIndex: number;

  /**
   * Whether the unit section structure passed review.
   *
   * If true, the section generation can proceed. If false, the unit generation
   * must be retried with feedback.
   */
  approved: boolean;

  /**
   * Detailed review feedback.
   *
   * Contains specific validation results and recommendations. If approved, may
   * contain suggestions for future reference. If rejected, contains actionable
   * feedback for revision.
   */
  feedback: string;

  /**
   * Revised unit sections if modifications were made during review.
   *
   * If the reviewer made direct corrections to the structure, this field
   * contains the updated sections. Otherwise undefined.
   */
  revisedSections?: AutoBeAnalyzeWriteUnitEvent.IUnitSection[];

  /**
   * Current iteration number of the review process.
   *
   * Tracks how many review cycles have been completed for this module section's
   * unit content.
   */
  step: number;
}
