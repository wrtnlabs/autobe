import { AutoBeTestScenario } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";

export interface IAutoBeTestScenarioApplication {
  /**
   * Process test scenario generation task or preliminary data requests.
   *
   * Creates focused test scenarios (1-3 per endpoint) for API endpoints by
   * retrieving necessary interface operations via RAG (Retrieval-Augmented
   * Generation) and generating detailed test drafts with dependencies.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeTestScenarioApplication.IProps): void;
}

export namespace IAutoBeTestScenarioApplication {
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
     * test scenario generation (complete). When preliminary returns empty
     * array, that type is removed from the union, physically preventing
     * repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas;
  }

  /**
   * Request to generate test scenarios for API endpoints.
   *
   * Executes test scenario generation to create focused, implementable test
   * scenarios (1-3 per endpoint) covering the most critical business workflows,
   * primary success paths, and important edge cases.
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
     * Array of generated test scenarios for the target operation.
     *
     * Contains 1-3 focused test scenarios that cover:
     *
     * - Primary success paths (most common business workflows)
     * - Important edge cases (critical boundary conditions)
     * - Key error scenarios (meaningful business logic failures)
     *
     * Each scenario includes:
     *
     * - endpoint: The target API operation being tested
     * - functionName: snake_case test function name
     * - draft: Detailed test description and validation points
     * - dependencies: Ordered list of prerequisite operations (auth,
     *   setup, etc.)
     *
     * Guidelines:
     *
     * - Focus on business logic validation, not framework validation
     * - Each scenario must be independently implementable
     * - Dependencies must be correctly ordered (auth → setup → target)
     * - Avoid duplicate or overlapping scenarios
     */
    scenarios: AutoBeTestScenario[];
  }
}
