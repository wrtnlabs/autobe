import { AutoBeOpenApi } from "@autobe/interface";

export interface IAutoBeInterfaceComplementApplication {
  /**
   * Complements missing schema types
   *
   * This method fills in schema definitions that are referenced via $ref but
   * not yet defined in the `components.schemas` section. For example, if an API
   * operation references `{ "$ref": "#/components/schemas/UserProfile" }` but
   * `UserProfile` type is not defined in `components.schemas`, this method will
   * add the missing schema definition.
   *
   * This function is designed to be called via AI function calling mechanism to
   * ensure the OpenAPI document is complete and all referenced schemas are
   * properly defined.
   */
  complementComponents(
    props: IAutoBeInterfaceComplementApplication.IProps,
  ): void;
}
export namespace IAutoBeInterfaceComplementApplication {
  export interface IProps {
    /**
     * TypeScript draft code for complement schema definitions.
     *
     * This property contains TypeScript interface definitions for missing schema
     * types that were referenced but not defined in the initial schema generation.
     * Similar to the main schema draft, this serves as a preliminary TypeScript
     * representation before converting to JSON Schema format.
     *
     * The draft helps ensure that complementary schemas maintain consistency with
     * the existing type system and follow the same conventions as the primary schemas.
     * 
     * This draft typically includes:
     * - Missing entity interfaces referenced via $ref
     * - Nested object types used within other schemas
     * - Shared utility types or enumerations
     * - Any transitively referenced types
     *
     * The final schemas in the `schemas` property should be validated against and
     * derived from this TypeScript draft to ensure type safety and consistency
     * across the entire API specification.
     *
     * Example complement draft:
     * ```typescript
     * interface IUserProfile {
     *   id: string;
     *   userId: string;
     *   displayName: string;
     *   avatarUrl?: string;
     * }
     * 
     * interface IAddress {
     *   street: string;
     *   city: string;
     *   postalCode: string;
     * }
     * ```
     */
    draft: string;

    /**
     * A collection of missing schema definitions that need to be added to the
     * OpenAPI document's `components.schemas` section.
     *
     * This object contains schema definitions for types that are referenced but
     * not yet defined:
     *
     * - Key: Schema name (`string`): The name of the schema type that will be
     *   referenced in $ref statements
     * - Value: `AutoBeOpenApi.IJsonSchema` - The complete JSON Schema definition
     *   for that type
     *
     * Example structure:
     *
     * ```typescript
     * {
     *   "UserProfile": {
     *     "type": "object",
     *     "properties": {
     *       "id": { "type": "string" },
     *       "name": { "type": "string" },
     *       "email": { "type": "string", "format": "email" }
     *     },
     *     "required": ["id", "name", "email"]
     *   }
     * }
     * ```
     *
     * Each schema definition follows the JSON Schema specification and will be
     * directly inserted into the OpenAPI document's components.schemas section,
     * making them available for $ref references throughout the API
     * specification.
     */
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  }
}
