import { AutoBeInterfaceSchemaDesign } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";

export interface IAutoBeInterfaceSchemaApplication {
  /**
   * Process schema generation, write submission, or preliminary data requests.
   *
   * Submit schema designs via `write`, then review your own output. Call
   * `complete` if satisfied, or submit another `write` to improve (3 writes
   * maximum).
   *
   * @param props Request containing preliminary data request, write submission,
   *   or completion signal
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
     * - If this is a revision, what issues are you improving and how?
     *
     * For complete:
     *
     * - State why you consider the last write final.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform:
     *
     * - Preliminary types: Load context data incrementally
     * - `write`: Submit schema design
     * - `complete`: Finalize when satisfied with last write
     *
     * When preliminary returns empty array, that type is removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IWrite
      | IAutoBePreliminaryComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations
      | IAutoBePreliminaryGetPreviousInterfaceSchemas;
  }

  /**
   * Submit schema design for review.
   *
   * The submitted design should conform to the database schema, operation
   * requirements, and JSON schema structure rules.
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
