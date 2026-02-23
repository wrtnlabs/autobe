import { AutoBeAnalyzeWriteSectionEvent } from "./AutoBeAnalyzeWriteSectionEvent";
import { AutoBeAcquisitionEventBase } from "./base/AutoBeAcquisitionEventBase";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the review phase of section (###) generation.
 *
 * This event represents the final quality assurance step in the hierarchical
 * document generation pipeline. The Section Review Agent validates the detailed
 * content before final document assembly.
 *
 * Review criteria include:
 *
 * - Alignment with parent unit section's keywords and purpose
 * - EARS format compliance for requirements
 * - Mermaid diagram syntax correctness
 * - Implementation-ready specification quality
 * - Completeness and unambiguity of requirements
 * - No prohibited content (database schemas, API specs, etc.)
 *
 * Review outcomes:
 *
 * - **Approved**: Content is valid, ready for document assembly
 * - **Rejected**: Content needs revision, provide specific feedback
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeWriteSectionReviewEvent
  extends
    AutoBeEventBase<"analyzeWriteSectionReview">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase,
    AutoBeAcquisitionEventBase<"previousAnalysisFiles"> {
  /** Index of the grandparent module section being reviewed. */
  moduleIndex: number;

  /** Index of the parent unit section being reviewed. */
  unitIndex: number;

  /**
   * Whether the section content passed review.
   *
   * If true, the content is ready for final document assembly. If false, the
   * section generation must be retried with feedback.
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
   * Revised sections if modifications were made during review.
   *
   * If the reviewer made direct corrections to the content, this field contains
   * the updated sections. Set to `null` if no revisions were made.
   */
  revisedSections: AutoBeAnalyzeWriteSectionEvent.ISectionSection[] | null;

  /**
   * Current iteration number of the review process.
   *
   * Tracks how many review cycles have been completed for this unit section's
   * content.
   */
  step: number;
}
