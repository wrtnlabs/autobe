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
