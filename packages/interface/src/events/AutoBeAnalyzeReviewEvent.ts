import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired during the review and amendment phase of the requirements
 * analysis process.
 *
 * This event occurs when the Analyze agent is reviewing the drafted
 * requirements analysis and making amendments based on user feedback,
 * clarifications, or additional requirements. The review phase is a critical
 * part of the structured workflow that ensures the analysis accurately captures
 * all business needs and technical specifications before finalization.
 *
 * The review process involves iterative refinement where the agent evaluates
 * the completeness, accuracy, and clarity of the requirements documentation,
 * making necessary adjustments to improve the analysis quality and ensure it
 * properly guides subsequent development phases.
 *
 * @author Kakasoo
 */
export interface AutoBeAnalyzeReviewEvent
  extends AutoBeEventBase<"analyzeReview"> {
  /**
   * Review commentary and amendments being made to the requirements analysis.
   *
   * Contains the agent's assessment of the current analysis state, including
   * identified gaps, improvements being made, clarifications being added, or
   * refinements being applied based on user feedback. This review content
   * provides transparency into the iterative improvement process.
   *
   * The review may include analysis of requirement completeness, identification
   * of missing specifications, clarification of ambiguous requirements, or
   * restructuring of the documentation for better clarity and usability in
   * subsequent development phases.
   */
  review: string;

  /**
   * Current iteration number of the requirements analysis being reviewed.
   *
   * Indicates which version of the requirements analysis is undergoing review
   * and amendment. This step number helps track the iterative refinement
   * process and provides context for understanding how many revision cycles
   * have been completed.
   *
   * The step value increments with each major revision cycle, allowing
   * stakeholders to understand the evolution of the requirements and the level
   * of refinement that has been applied to achieve the final analysis.
   */
  step: number;

  /** Total number of documents to generate. */
  total: number;

  /** Number of documents generated so far. */
  completed: number;
}
