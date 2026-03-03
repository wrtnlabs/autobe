/**
 * Application interface for the Scenario Review agent.
 *
 * This agent reviews the scenario output against the user's original
 * requirements, checking entity coverage, hallucination, actor classification,
 * relationship completeness, and feature identification accuracy.
 */
export interface IAutoBeAnalyzeScenarioReviewApplication {
  /**
   * Process scenario review task.
   *
   * Reviews the scenario output and provides an approved/rejected verdict with
   * structured feedback.
   *
   * @param props Request containing the review result
   */
  process(props: IAutoBeAnalyzeScenarioReviewApplication.IProps): void;
}

export namespace IAutoBeAnalyzeScenarioReviewApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before completing the review, reflect on your analysis:
     *
     * - Does every user-mentioned concept have a corresponding entity?
     * - Are there entities the user never mentioned or implied?
     * - Are actors correctly classified by identity boundary?
     * - Are all entity relationships complete and bidirectional?
     * - Are features correctly identified from user requirements?
     */
    thinking?: string | null;

    /** Review result. */
    request: IComplete;
  }

  /** Request to complete the scenario review. */
  export interface IComplete {
    /** Type discriminator for the request. */
    type: "complete";

    /**
     * Whether the scenario passed review.
     *
     * Set to true if all review criteria pass. Set to false if any criterion
     * fails.
     */
    approved: boolean;

    /**
     * Detailed review feedback.
     *
     * When rejecting: describe each issue clearly so the scenario generator can
     * fix them on the next attempt.
     *
     * When approving: may include minor observations.
     */
    feedback: string;

    /**
     * Structured issues for targeted scenario regeneration.
     *
     * Each issue identifies a specific category and provides a concrete
     * suggestion for fixing the scenario.
     */
    issues: IScenarioReviewIssue[];
  }

  export interface IScenarioReviewIssue {
    /**
     * Issue category.
     *
     * - "missing_entity": User mentioned a concept but no entity exists for it
     * - "hallucinated_entity": Entity exists but user never mentioned or implied
     *   it
     * - "actor_misclassification": Actor's kind doesn't match identity boundary
     *   test
     * - "incomplete_relationship": Entity relationships are missing or
     *   one-directional
     * - "missing_feature": User mentioned a capability but feature is not
     *   activated
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
}
