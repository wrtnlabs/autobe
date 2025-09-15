import { IAutoBeTestScenarioApplication } from "./IAutoBeTestScenarioApplication";

export interface IAutoBeTestScenarioReviewApplication {
  review: (props: IAutoBeTestScenarioReviewApplication.IProps) => void;
}

export namespace IAutoBeTestScenarioReviewApplication {
  export interface IProps {
    /**
     * Concise review summary focusing on critical findings and key
     * improvements.
     *
     * Should include:
     *
     * - Executive summary of overall quality
     * - Critical issues requiring immediate fixes
     * - Key improvement recommendations
     * - Database schema compliance status
     * - Modified scenarios identification by functionName
     */
    review: string;

    /**
     * Structured action plan with priority-based improvements.
     *
     * Should contain:
     *
     * - Critical fixes required immediately
     * - High priority enhancements
     * - Implementation guidance
     * - Success criteria
     * - Specific scenario action items by functionName
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
