import { AutoBeAnalyzeWriteUnitEvent } from "./AutoBeAnalyzeWriteUnitEvent";
import { AutoBeAcquisitionEventBase } from "./base/AutoBeAcquisitionEventBase";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the batch review phase of ALL unit sections (##) in a
 * file.
 *
 * This event represents the quality assurance step for ALL unit sections in a
 * single file, reviewed together in one LLM call. The Batch Unit Review Agent
 * validates the entire file's unit structure before allowing progression to
 * section generation.
 *
 * Review criteria include:
 *
 * - Alignment of all unit sections with their parent module sections
 * - Consistency across the entire file's structure
 * - Complete functional requirement coverage without overlap
 * - Clear section boundaries throughout the file
 * - Keywords adequately represent section topics
 *
 * Review outcomes:
 *
 * - **Approved**: All structures are valid, proceed to section generation
 * - **Rejected**: Structures need revision, regenerate ALL units with feedback
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeWriteAllUnitReviewEvent
  extends
    AutoBeEventBase<"analyzeWriteAllUnitReview">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase,
    AutoBeAcquisitionEventBase<"previousAnalysisFiles"> {
  /**
   * Whether ALL unit sections passed review.
   *
   * If true, section generation can proceed for all modules. If false, ALL unit
   * generation must be retried with feedback.
   */
  approved: boolean;

  /**
   * Detailed review feedback covering the entire file's unit structure.
   *
   * Contains specific validation results and recommendations. If approved, may
   * contain suggestions for future reference. If rejected, contains actionable
   * feedback for revision of all units.
   */
  feedback: string;

  /**
   * Revised unit sections for ALL modules if modifications were made during
   * review.
   *
   * If the reviewer made direct corrections to the structure, this field
   * contains the updated sections organized by module index. Set to `null` if
   * no revisions were made.
   */
  revisedUnits: IRevisedModuleUnit[] | null;

  /**
   * Current iteration number of the review process.
   *
   * Tracks how many batch review cycles have been completed for this file.
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

/** Structure for revised units of a single module section. */
export interface IRevisedModuleUnit {
  /** Index of the module section these units belong to. */
  moduleIndex: number;

  /** Revised unit sections for this module. */
  unitSections: AutoBeAnalyzeWriteUnitEvent.IUnitSection[];
}
