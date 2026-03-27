import { AutoBeInterfaceSchemaDesign } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";
import { IComplete } from "../../common/structures/IComplete";

export interface IAutoBeInterfaceSchemaApplication {
  /**
   * Process schema generation, write submission, or preliminary data requests.
   *
   * Submit schema designs via `write` for external validation. If validation
   * fails, diagnostics are provided and you should correct and resubmit.
   * Call `complete` only after a successful write validation.
   *
   * @param props Request containing preliminary data request, write
   *   submission, or completion confirmation
   */
  process(props: IAutoBeInterfaceSchemaApplication.IProps): void;
}

export namespace IAutoBeInterfaceSchemaApplication {
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
     * - If this is an initial write, summarize your design plan.
     * - If this is a correction, what validation errors are you fixing and how?
     *
     * For completion:
     *
     * - Confirm that the last write passed validation successfully.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform:
     *
     * - Preliminary types: Load context data incrementally
     * - `write`: Submit schema design for external validation
     * - `complete`: Finalize after successful write validation
     *
     * When preliminary returns empty array, that type is removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IWrite
      | IComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations
      | IAutoBePreliminaryGetPreviousInterfaceSchemas;
  }

  /**
   * Submit schema design for external validation.
   *
   * The submitted design will be validated against the database schema,
   * operation requirements, and JSON schema structure rules.
   */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /**
     * Analysis of the type's purpose and context.
     *
     * Before designing the schema, analyze what you know:
     *
     * - What is this type for? (e.g., IProduct.ICreate is a creation request)
     * - What database entities or operations inform its structure?
     * - What fields should be included based on the variant type?
     * - Are there related types that provide structural hints?
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

    /**
     * Design structure for the schema being generated.
     *
     * Contains `databaseSchema`, `specification`, `description`, and `schema`
     * fields that together define a complete DTO type component.
     */
    design: AutoBeInterfaceSchemaDesign;
  }
}
