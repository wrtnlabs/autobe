import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";

export interface IAutoBeInterfaceSchemaApplication {
  /**
   * Process schema generation task or preliminary data requests.
   *
   * Generates OpenAPI components containing named schema types and integrates
   * them into the final OpenAPI specification. Processes all entity schemas,
   * their variants, and related type definitions to ensure comprehensive and
   * consistent API design.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
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
     * (getAnalysisFiles, getDatabaseSchemas, getInterfaceOperations) or final
     * schema generation (complete). When preliminary returns empty array, that
     * type is removed from the union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations
      | IAutoBePreliminaryGetPreviousInterfaceSchemas;
  }

  /**
   * Request to generate a single OpenAPI schema component.
   *
   * Executes schema generation to create a type definition for a specific DTO
   * type. Each invocation handles one schema component to ensure accuracy and
   * clear responsibility.
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
     * JSON schema component for the specified type.
     *
     * This property contains the type definition for a single DTO type that
     * will be used in the OpenAPI specification's components.schemas section.
     * The type name is already provided in the input context, so only the
     * schema definition itself needs to be returned.
     *
     * DO: Define object types as named types in the components.schemas section.
     * DO NOT: Use inline anonymous object definitions.
     *
     * This schema represents:
     *
     * - Main entity types (IEntityName)
     * - Operation-specific variants (.ICreate, .IUpdate, .ISummary, etc.)
     * - Container types (IPage<T> for pagination)
     * - Enumeration types
     *
     * DO: Include detailed descriptions that reference the original database
     * schema comments and thoroughly document each property. DO: Use a $ref to
     * a named type in the components.schemas section for every property that
     * references an object.
     *
     * This applies to all objects in request bodies, response bodies, and
     * properties that are objects or arrays of objects.
     *
     * Example structure for typeName "IUser":
     *
     * ```typescript
     * {
     *   "type": "object",
     *   "properties": {
     *     "id": { "type": "string", "format": "uuid" },
     *     "email": { "type": "string", "format": "email" },
     *     "profile": { "$ref": "#/components/schemas/IUserProfile" }
     *   },
     *   "required": ["id", "email"],
     *   "description": "User entity representing system account holders..."
     * }
     * ```
     */
    schema: AutoBeOpenApi.IJsonSchemaDescriptive;
  }
}
