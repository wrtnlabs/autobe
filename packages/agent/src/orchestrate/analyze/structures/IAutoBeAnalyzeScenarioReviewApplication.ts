/**
 * Reviews scenario output against user requirements for entity coverage,
 * hallucination, and consistency.
 */
export interface IAutoBeAnalyzeScenarioReviewApplication {
  /**
   * Review scenario and provide approved/rejected verdict with structured
   * feedback.
   */
  process(props: IAutoBeAnalyzeScenarioReviewApplicationProps): void;
}

export interface IAutoBeAnalyzeScenarioReviewApplicationProps {
  /**
   * Reasoning about your current state: what's missing (preliminary) or what
   * you accomplished (completion).
   */
  thinking?: string | null;

  /** Action to perform: submit review verdict. */
  request: IAutoBeAnalyzeScenarioReviewApplicationComplete;
}

/** Request to complete the scenario review. */
export interface IAutoBeAnalyzeScenarioReviewApplicationComplete {
  /** Type discriminator for completion request. */
  type: "complete";

  /** Whether the scenario passed review. */
  approved: boolean;

  /**
   * Detailed review feedback. When rejecting, describe issues clearly for the
   * next attempt.
   */
  feedback: string;

  /** Structured issues for targeted scenario regeneration. */
  issues: IAutoBeAnalyzeScenarioReviewApplicationScenarioReviewIssue[];
}

export interface IAutoBeAnalyzeScenarioReviewApplicationScenarioReviewIssue {
  /**
   * Issue category.
   *
   * - "missing_entity": User mentioned a concept but no entity exists for it
   * - "hallucinated_entity": Entity exists but user never mentioned or implied it
   * - "actor_misclassification": Actor's kind doesn't match identity boundary
   *   test
   * - "incomplete_relationship": Entity relationships are missing or
   *   one-directional
   * - "missing_feature": User mentioned a capability but feature is not activated
   * - "hallucinated_feature": Feature is activated but user never requested it
   */
  category:
    | "missing_entity"
    | "hallucinated_entity"
    | "actor_misclassification"
    | "incomplete_relationship"
    | "missing_feature"
    | "hallucinated_feature";

  /** Human-readable description of the issue. */
  description: string;

  /** Concrete suggestion for fixing the issue. */
  suggestion: string;
}
