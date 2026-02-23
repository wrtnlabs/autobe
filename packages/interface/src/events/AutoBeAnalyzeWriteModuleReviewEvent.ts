import { AutoBeAnalyzeWriteModuleEvent } from "./AutoBeAnalyzeWriteModuleEvent";
import { AutoBeAcquisitionEventBase } from "./base/AutoBeAcquisitionEventBase";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the review phase of module section (#) generation.
 *
 * This event represents the quality assurance step in the hierarchical document
 * generation pipeline. The Module Review Agent validates the document structure
 * produced by the Module Agent before allowing progression to unit section
 * generation.
 *
 * Review criteria include:
 *
 * - Document title appropriateness and clarity
 * - Summary completeness and accuracy
 * - Module section coverage (all required topics included)
 * - Section purposes are clear and non-overlapping
 * - Logical organization of sections
 *
 * Review outcomes:
 *
 * - **Approved**: Structure is valid, proceed to unit section generation
 * - **Rejected**: Structure needs revision, provide specific feedback
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeWriteModuleReviewEvent
  extends
    AutoBeEventBase<"analyzeWriteModuleReview">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase,
    AutoBeAcquisitionEventBase<"previousAnalysisFiles"> {
  /**
   * Whether the module section structure passed review.
   *
   * If true, the unit section generation can proceed. If false, the module
   * generation must be retried with feedback.
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
   * Revised module sections if modifications were made during review.
   *
   * If the reviewer made direct corrections to the structure, this field
   * contains the updated sections. Set to `null` if no revisions were made.
   */
  revisedSections: AutoBeAnalyzeWriteModuleEvent.IModuleSection[] | null;

  /**
   * Revised title if modified during review. Set to `null` if no revisions were
   * made.
   */
  revisedTitle: string | null;

  /**
   * Revised summary if modified during review. Set to `null` if no revisions
   * were made.
   */
  revisedSummary: string | null;

  /**
   * Current iteration number of the review process.
   *
   * Tracks how many review cycles have been completed for this document.
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
