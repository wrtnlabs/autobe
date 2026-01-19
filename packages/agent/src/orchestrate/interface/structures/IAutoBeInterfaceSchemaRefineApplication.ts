import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";

/**
 * Application interface for the Schema Refine agent.
 *
 * The Schema Refine agent detects and corrects degenerate type aliases where
 * complex data structures have been incorrectly simplified to primitive types
 * (`string`, `number`, `boolean`, `integer`).
 *
 * This agent analyzes JSDoc descriptions, database schema hints, and naming
 * conventions to identify mismatches between documented semantics and actual
 * type definitions, then provides corrected object schema definitions.
 */
export interface IAutoBeInterfaceSchemaRefineApplication {
  /**
   * Process schema refinement task or preliminary data requests.
   *
   * Analyzes a potentially degenerate primitive type alias and determines
   * whether it should be refined into a proper object schema structure. Uses
   * Chain-of-Thought reasoning to systematically evaluate the type.
   *
   * @param props Request containing either preliminary data request or
   *   refinement completion
   */
  process(props: IAutoBeInterfaceSchemaRefineApplication.IProps): void;
}

export namespace IAutoBeInterfaceSchemaRefineApplication {
  /** Properties for schema refinement processing. */
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
     * (getAnalysisFiles, getDatabaseSchemas, getInterfaceOperations,
     * getInterfaceSchemas, etc.) or final refinement decision (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations
      | IAutoBePreliminaryGetPreviousInterfaceSchemas;
  }

  /**
   * Request to complete schema refinement analysis.
   *
   * Executes the final refinement decision after analyzing a potentially
   * degenerate primitive type. Uses structured Chain-of-Thought reasoning
   * through observation, reasoning, and verdict properties to ensure systematic
   * evaluation before making a decision.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval or actual
     * task execution. Value "complete" indicates this is the final refinement
     * decision request.
     */
    type: "complete";

    /**
     * Observation of the current type and its documentation.
     *
     * Describe what you observe about the type being analyzed:
     *
     * - What is the current type definition? (e.g., `type IFoo = number`)
     * - What does the JSDoc/description say about the type?
     * - Are there any database schema hints (JSON field, etc.)?
     * - What does the naming suggest? (e.g., "Distribution", "Preferences")
     *
     * This is purely descriptive - state facts without judgment.
     */
    observation: string;

    /**
     * Reasoning about whether the type is degenerate.
     *
     * Analyze the observations and explain your reasoning:
     *
     * - Does the documentation describe a structure that contradicts the
     *   primitive type?
     * - Are there keywords suggesting complex structure? (key/value, array, list,
     *   contains, mapping)
     * - Is this a legitimate semantic alias? (e.g., `IUserId = string`)
     * - What type SHOULD this be based on the evidence?
     */
    reasoning: string;

    /**
     * Final verdict on whether to refine the type.
     *
     * State your conclusion clearly:
     *
     * - Is this a degenerate type that needs refinement, or a valid primitive?
     * - Summarize the key evidence that led to this decision.
     * - If refining, briefly describe what the correct type should be.
     */
    verdict: string;

    /**
     * The refined object schema that replaces the degenerate primitive.
     *
     * If the type needs refinement, provide the correct object schema
     * definition. The schema should accurately represent the data structure
     * described in the documentation.
     *
     * If `null`, the original type is intentional and correct (not degenerate).
     *
     * Common patterns:
     *
     * - `Record<string, T>`: Use `{ type: "object", additionalProperties: {...}
     *   }`
     * - Structured object: Use `{ type: "object", properties: {...} }`
     */
    schema: AutoBeOpenApi.IJsonSchemaDescriptive.IObject | null;
  }
}
