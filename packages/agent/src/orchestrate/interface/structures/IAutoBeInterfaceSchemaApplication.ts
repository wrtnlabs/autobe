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
   * DO: Follow established naming conventions (IEntityName,
   * IEntityName.ICreate, etc.) DO: Document thoroughly with descriptions that
   * reference the original Prisma schema comments.
   *
   * @param props Properties containing components to generate.
   */
  makeComponents(props: IAutoBeInterfaceSchemaApplication.IProps): void;
}
export namespace IAutoBeInterfaceSchemaApplication {
  export interface IProps {
    /**
     * TypeScript draft code for schema definitions.
     *
     * This property contains TypeScript interface definitions that serve as a
     * preliminary draft before generating the final JSON schema components.
     * The draft allows for initial design and validation of the schema structure
     * using TypeScript's type system before converting to OpenAPI/JSON Schema format.
     *
     * The draft typically includes:
     * - Entity interfaces matching the Prisma models
     * - Operation-specific variants (ICreate, IUpdate, etc.)
     * - Utility types and enumerations
     * - Type relationships and constraints
     *
     * This TypeScript draft serves as the foundation for the subsequent schema
     * generation, ensuring type safety and consistency. The final schemas in the
     * `schemas` property should be derived from and validated against this draft.
     *
     * Example draft structure:
     * ```typescript
     * interface IUser {
     *   id: string;
     *   email: string;
     *   profile: IUserProfile;
     * }
     * 
     * namespace IUser {
     *   interface ICreate extends Omit<IUser, "id"> {}
     *   interface IUpdate extends Partial<ICreate> {}
     * }
     * ```
     */
    draft: string;

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
