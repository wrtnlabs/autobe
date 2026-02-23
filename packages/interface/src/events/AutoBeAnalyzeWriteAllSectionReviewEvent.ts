import { AutoBeAnalyzeWriteSectionEvent } from "./AutoBeAnalyzeWriteSectionEvent";
import { AutoBeAcquisitionEventBase } from "./base/AutoBeAcquisitionEventBase";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the batch review phase of ALL section sections (###) in a
 * file.
 *
 * This event represents the final quality assurance step for ALL section
 * content in a single file, reviewed together in one LLM call. The Batch
 * Section Review Agent validates the entire file's detailed content before
 * final document assembly.
 *
 * Review criteria include:
 *
 * - Alignment with parent unit section's keywords and purpose
 * - EARS format compliance for all requirements
 * - Mermaid diagram syntax correctness throughout
 * - Implementation-ready specification quality
 * - Completeness and unambiguity of all requirements
 * - No prohibited content anywhere
 * - Consistency across all sections
 *
 * Review outcomes:
 *
 * - **Approved**: All content is ready for document assembly
 * - **Rejected**: Content needs revision, regenerate ALL sections with feedback
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeWriteAllSectionReviewEvent
  extends
    AutoBeEventBase<"analyzeWriteAllSectionReview">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase,
    AutoBeAcquisitionEventBase<"previousAnalysisFiles"> {
  /**
   * Whether ALL section sections passed review.
   *
   * If true, content is ready for document assembly. If false, ALL section
   * generation must be retried with feedback.
   */
  approved: boolean;

  /**
   * Detailed review feedback covering the entire file's section content.
   *
   * Contains specific validation results and recommendations. If approved, may
   * contain suggestions for future reference. If rejected, contains actionable
   * feedback for revision of all sections.
   */
  feedback: string;

  /**
   * Revised sections for ALL modules/units if modifications were made during
   * review.
   *
   * If the reviewer made direct corrections to the content, this field contains
   * the updated sections organized by module and unit index. Set to `null` if
   * no revisions were made.
   */
  revisedSections: IRevisedModuleSections[] | null;

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

/** Structure for revised sections of a single module. */
export interface IRevisedModuleSections {
  /** Index of the module section. */
  moduleIndex: number;

  /** Revised sections for each unit in this module. */
  units: IRevisedUnitSections[];
}

/** Structure for revised sections of a single unit. */
export interface IRevisedUnitSections {
  /** Index of the unit section. */
  unitIndex: number;

  /** Revised section sections for this unit. */
  sectionSections: AutoBeAnalyzeWriteSectionEvent.ISectionSection[];
}
