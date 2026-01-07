import { AutoBeTestScenario } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";

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
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getDatabaseSchemas, etc.):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     *
     * - What key assets did you acquire?
     * - What did you accomplish?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every single item.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles, getInterfaceOperations, getInterfaceSchemas) or final
     * test scenario review (complete). When preliminary returns empty array,
     * that type is removed from the union, physically preventing repeated
     * calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas;
  }

  /**
   * Request to review and refine a single test scenario.
   *
   * Executes comprehensive scenario review to validate implementability,
   * dependency correctness, authentication flows, and business logic coverage,
   * producing refined scenario ready for test implementation.
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
     * Comprehensive review analysis of the test scenario.
     *
     * Analyzes the scenario for implementability, dependency correctness,
     * authentication flows, execution order, and business logic coverage.
     * Documents identified issues and applied corrections.
     *
     * Should include:
     *
     * - Authentication validation (correct authorizationActor alignment)
     * - Dependency completeness (all prerequisites present)
     * - Execution order verification (proper sequencing)
     * - Business logic coverage assessment
     * - Specific issues found and corrections applied
     */
    review: string;

    /**
     * The improved test scenario, or null if no improvements needed.
     *
     * Decision logic:
     *
     * - If ANY improvements were made (auth fixes, dependency corrections,
     *   reordering) → Return the complete improved AutoBeTestScenario
     * - If scenario is already perfect with no issues → Return null
     *
     * When returning improved scenario:
     *
     * - Endpoint MUST match the original (same method and path)
     * - FunctionName MUST match the original (same name)
     * - Draft can be improved if needed
     * - Dependencies should be corrected and properly ordered
     */
    content: AutoBeTestScenario | null;
  }
}
