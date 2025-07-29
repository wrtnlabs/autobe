import { AutoBeOpenApi } from "@autobe/interface";

export interface IAutoBeInterfaceSchemaApplication {
  /**
   * Generate OpenAPI components containing named schema types.
   *
   * This method receives a complete set of schema components and integrates
   * them into the final OpenAPI specification. It processes all entity schemas,
   * their variants, and related type definitions to ensure a comprehensive and
   * consistent API design.
   *
   * The provided components should include schemas for all entities identified
   * in the previous phases of API path/method definition and operation
   * creation. This ensures that the final OpenAPI document has complete type
   * coverage for all operations.
   *
   * CRITICAL: All schema definitions must follow the established naming
   * conventions (IEntityName, IEntityName.ICreate, etc.) and must be thoroughly
   * documented with descriptions that reference the original Prisma schema
   * comments.
   *
   * @param props Properties containing components to generate.
   */
  makeComponents(props: IAutoBeInterfaceSchemaApplication.IProps): void;
}
export namespace IAutoBeInterfaceSchemaApplication {
  export interface IProps {
    /**
     * Complete set of schema components for the OpenAPI specification.
     *
     * This property contains comprehensive type definitions for all entities in
     * the system. It is the central repository of all named schema types that
     * will be used throughout the API specification.
     *
     * CRITICAL REQUIREMENT: All object types MUST be defined as named types in
     * the components.schemas section. Inline anonymous object definitions are
     * strictly prohibited.
     *
     * This components object should include:
     *
     * - Main entity types (IEntityName)
     * - Operation-specific variants (.ICreate, .IUpdate, .ISummary, etc.)
     * - Container types (IPage<T> for pagination)
     * - Enumeration types
     *
     * All schema definitions must include detailed descriptions that reference
     * the original Prisma schema comments and thoroughly document each
     * property. Every property that references an object must use a $ref to a
     * named type in the components.schemas section. This applies to all objects
     * in request bodies, response bodies, and properties that are objects or
     * arrays of objects.
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
