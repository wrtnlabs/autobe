import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when the Scenario Review agent validates the analyze scenario
 * output against the user's original requirements.
 *
 * This review checks entity coverage, hallucination, actor classification,
 * relationship completeness, and feature identification accuracy before the
 * scenario flows into downstream stages (Module → Unit → Section).
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeScenarioReviewEvent
  extends AutoBeEventBase<"analyzeScenarioReview">, AutoBeAggregateEventBase {
  /**
   * Whether the scenario passed the review.
   *
   * If true, the scenario is accepted and downstream stages proceed. If false,
   * the scenario must be regenerated with feedback.
   */
  approved: boolean;

  /**
   * Detailed review feedback.
   *
   * When rejected, contains specific issues and recommendations. When approved,
   * may contain minor observations.
   */
  feedback: string;

  /** Structured review issues for targeted scenario regeneration. */
  issues: AutoBeAnalyzeScenarioReviewIssue[];

  /** Current step number in the analysis state machine. */
  step: number;

  /** Retry attempt number (0-based). */
  retry: number;
}

/** Structured issue identified during scenario review. */
export interface AutoBeAnalyzeScenarioReviewIssue {
  /** Issue category for programmatic handling. */
  category:
    | "missing_entity"
    | "hallucinated_entity"
    | "actor_misclassification"
    | "incomplete_relationship"
    | "missing_feature"
    | "hallucinated_feature";

  /** Human-readable description of the issue. */
  description: string;

  /** Suggested fix for the scenario regeneration. */
  suggestion: string;
}
