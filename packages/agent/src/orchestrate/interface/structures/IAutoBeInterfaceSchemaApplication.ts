import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

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
     * Before requesting preliminary data or completing your task, reflect on your
     * current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getPrismaSchemas, etc.):
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     * - What key assets did you acquire?
     * - What did you accomplish?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every single item.
     *
     * This reflection helps you avoid duplicate requests and premature completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles, getPrismaSchemas, getInterfaceOperations) or final
     * schema generation (complete). When preliminary returns empty array, that
     * type is removed from the union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPrismaSchemas
      | IAutoBePreliminaryGetInterfaceOperations;
  }

  /**
   * Request to generate OpenAPI schema components.
   *
   * Executes schema generation to create comprehensive type definitions for all
   * entities in the system. Ensures complete type coverage for all operations in
   * the OpenAPI specification.
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
     * Complete set of schema components for the OpenAPI specification.
     *
     * This property contains comprehensive type definitions for all entities in
     * the system. It is the central repository of all named schema types that
     * will be used throughout the API specification.
     *
     * DO: Define all object types as named types in the components.schemas
     * section. DO NOT: Use inline anonymous object definitions.
     *
     * This components object includes:
     *
     * - Main entity types (IEntityName)
     * - Operation-specific variants (.ICreate, .IUpdate, .ISummary, etc.)
     * - Container types (IPage<T> for pagination)
     * - Enumeration types
     *
     * DO: Include detailed descriptions that reference the original Prisma
     * schema comments and thoroughly document each property. DO: Use a $ref to
     * a named type in the components.schemas section for every property that
     * references an object.
     *
     * This applies to all objects in request bodies, response bodies, and
     * properties that are objects or arrays of objects.
     *
     * Example structure:
     *
     * ```typescript
     * {
     *   schemas: {
     *     IUser: {
     *       type: "object",
     *       properties: {
     *         id: { type: "string", format: "uuid" },
     *         email: { type: "string", format: "email" },
     *         profile: { "$ref": "#/components/schemas/IUserProfile" }
     *       },
     *       required: ["id", "email"],
     *       description: "User entity representing system account holders..."
     *     },
     *     "IUser.ICreate": { ... },
     *     // Additional schemas
     *   }
     * }
     * ```
     */
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  }
}
