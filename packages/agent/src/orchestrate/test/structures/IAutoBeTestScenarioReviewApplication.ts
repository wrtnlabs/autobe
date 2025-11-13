import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBeTestScenarioApplication } from "./IAutoBeTestScenarioApplication";

export interface IAutoBeTestScenarioReviewApplication {
  /**
   * Process test scenario review task or preliminary data requests.
   *
   * Reviews generated test scenarios to validate implementability, dependency
   * correctness, and business logic coverage, producing necessary improvements
   * via RAG-based context retrieval.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeTestScenarioReviewApplication.IProps): void;
}

export namespace IAutoBeTestScenarioReviewApplication {
  export interface IProps {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getInterfaceOperations) or final test scenario review (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request: IComplete | IAutoBePreliminaryGetInterfaceOperations;
  }

  /**
   * Request to review and refine test scenarios.
   *
   * Executes comprehensive scenario review to validate implementability,
   * dependency correctness, authentication flows, and business logic coverage,
   * producing refined scenarios ready for test implementation.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval or actual
     * task execution. Value "complete" indicates this is the final task
     * execution request.
     */
    type: "complete";

    /**
     * Comprehensive review analysis of all test scenarios.
     *
     * Contains detailed findings from holistic review including:
     *
     * - Executive summary of overall scenario quality
     * - Critical issues requiring immediate fixes (non-existent dependencies,
     *   unimplementable scenarios)
     * - Key improvement recommendations (authentication flows, edge case
     *   coverage)
     * - Database schema compliance validation
     * - Modified scenarios identification by functionName
     *
     * The review provides actionable feedback for creating implementable,
     * comprehensive test scenarios that accurately reflect business
     * requirements.
     */
    review: string;

    /**
     * Strategic test improvement plan.
     *
     * Contains structured action plan with priority-based improvements:
     *
     * - Critical fixes: Non-existent endpoints, impossible dependencies
     * - High priority enhancements: Missing authentication, incomplete edge
     *   cases
     * - Implementation guidance: Correct dependency patterns, proper test flows
     * - Success criteria: Complete API coverage, implementable scenarios only
     * - Specific scenario action items by functionName
     *
     * This plan serves as the blueprint for validating and improving test
     * scenarios.
     */
    plan: string;

    /** If the scenario groups pass the review, Set to true. */
    pass: boolean;

    /**
     * The reviewed and improved scenario groups with all quality fixes applied.
     *
     * This is the primary output containing:
     *
     * - All critical issues resolved
     * - Authentication flows corrected
     * - Database dependencies validated
     * - Quality enhancements implemented
     * - Only implementable scenarios retained
     */
    scenarioGroups: IAutoBeTestScenarioApplication.IScenarioGroup[];
  }
}
