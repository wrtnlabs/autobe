import { AutoBeTestScenario } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
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
   * @param props Preliminary data request, write submission, or completion
   *   confirmation
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
     * For preliminary requests (getAnalysisSections, getDatabaseSchemas, etc.):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For write submissions:
     *
     * - What review findings are you submitting?
     * - What corrections or deletions are you applying?
     *
     * For complete:
     *
     * - State why you consider the last write final.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval, write
     * submission, or completion signal. Exhausted preliminary types are removed
     * from the union, physically preventing repeated calls.
     */
    request:
      | IWrite
      | IAutoBePreliminaryComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas;
  }

  /**
   * Submit a test scenario review for validation.
   *
   * Submits comprehensive scenario review to validate implementability,
   * dependency correctness, authentication flows, and business logic coverage,
   * producing refined scenario ready for test implementation.
   */
  export interface IWrite {
    /**
     * Type discriminator for the request.
     *
     * Value "write" indicates this is a write submission for external
     * validation.
     */
    type: "write";

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
     * The review result: improved scenario, deletion flag, or null.
     *
     * Decision logic (THREE possible outcomes):
     *
     * - If scenario VIOLATES ABSOLUTE PROHIBITIONS (tests HTTP 400 validation
     *   errors, invalid types, missing fields, etc.) → Return "erase" to delete
     *   the entire scenario
     * - If scenario needs improvements (auth fixes, dependency corrections,
     *   reordering) → Return the complete improved AutoBeTestScenario
     * - If scenario is already perfect with no issues → Return null
     *
     * When returning "erase":
     *
     * - Scenario tests framework-level validations (forbidden per Section 2.1 of
     *   TEST_SCENARIO.md)
     * - Scenario tests type mismatches, missing fields, invalid formats, or any
     *   HTTP 400 validation errors
     * - These scenarios are fundamentally wrong and must be completely removed
     * - Document in review field WHY the scenario was erased
     *
     * When returning improved scenario:
     *
     * - Endpoint MUST match the original (same method and path)
     * - FunctionName MUST match the original (same name)
     * - Draft can be improved if needed
     * - Dependencies should be corrected and properly ordered
     *
     * When returning null:
     *
     * - Scenario is correct and implementable as-is
     * - No authentication issues, dependency problems, or ordering errors
     * - Tests business logic, not framework validations
     */
    content: AutoBeTestScenario | "erase" | null;
  }
}

/** @deprecated Use IAutoBeTestScenarioReviewApplication.IWrite instead. */
export type IAutoBeTestScenarioReviewApplicationComplete =
  IAutoBeTestScenarioReviewApplication.IWrite;
