import { AutoBeInterfaceSchemaDesign } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";

export interface IAutoBeInterfaceSchemaComplementApplication {
  /**
   * Process schema complement task or preliminary data requests.
   *
   * Adds missing schema definitions to ensure OpenAPI document is complete and
   * all referenced schemas are properly defined.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceSchemaComplementApplication.IProps): void;
}

export namespace IAutoBeInterfaceSchemaComplementApplication {
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
     * getInterfaceSchemas, getPreviousAnalysisFiles,
     * getPreviousDatabaseSchemas, getPreviousInterfaceOperations,
     * getPreviousInterfaceSchemas) or final schema complementation (complete).
     * When preliminary returns empty array, that type is removed from the
     * union, physically preventing repeated calls.
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
   * Request to add a missing schema definition.
   *
   * Executes schema complementation to fill in a referenced but undefined
   * schema type in the OpenAPI document's components.schemas section. Ensures
   * the $ref reference resolves to a valid schema definition.
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
     * Analysis of the missing type's purpose and context.
     *
     * Before designing the schema, analyze what you know:
     *
     * - What is this missing type for? Why is it referenced?
     * - Where is it referenced from? ($ref in which schemas/operations?)
     * - What does the reference context tell us about its expected structure?
     * - Are there similar types that provide structural hints?
     */
    analysis: string;

    /**
     * Rationale for the schema design decisions.
     *
     * Explain why you designed the schema this way:
     *
     * - Which properties did you include and why?
     * - What is required vs optional, and why?
     * - Which types use $ref and why?
     * - What was excluded and why? (e.g., auto-generated fields for ICreate)
     */
    rationale: string;

    design: AutoBeInterfaceSchemaDesign;
  }
}
