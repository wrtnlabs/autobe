import { AutoBeTestScenario } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
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
   * @param props Preliminary data request, write submission, or completion
   *   confirmation
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
     * For preliminary requests: what information is missing and why?
     *
     * For write: what scenarios you're submitting and key decisions.
     *
     * For complete: why you consider the last write final.
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
   * Submit test scenarios for API endpoints.
   *
   * Submits test scenario data to create focused, implementable test scenarios
   * (1-3 per endpoint) covering the most critical business workflows, primary
   * success paths, and important edge cases.
   */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

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
     * - Endpoint: The target API operation being tested
     * - FunctionName: snake_case test function name
     * - Draft: Detailed test description and validation points
     * - Dependencies: Ordered list of prerequisite operations (auth, setup, etc.)
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

/** @deprecated Use IAutoBeTestScenarioApplication.IWrite instead. */
export type IAutoBeTestScenarioApplicationComplete =
  IAutoBeTestScenarioApplication.IWrite;
