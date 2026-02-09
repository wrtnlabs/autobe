import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * Add a new property to a DTO schema.
 *
 * Use when a property is missing: database field not included, relation
 * not exposed, or computed property needed.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyCreate {
  /** Property key to add. */
  key: string;

  /**
   * Database schema property this maps to, or `null` for computed properties.
   *
   * When `null`, `specification` must explain the computation logic.
   */
  databaseSchemaProperty: string | null;

  /**
   * Evidence and reasoning for adding this property.
   *
   * Describe what you found that requires this addition.
   */
  reason: string;

  /** Discriminator for property revision type. */
  type: "create";

  /**
   * Implementation guidance for downstream agents.
   *
   * Internal documentation for Realize/Test agents. When `databaseSchemaProperty`
   * is `null`, this must fully explain the computation logic.
   */
  specification: string;

  /**
   * API documentation for consumers (Swagger UI).
   *
   * Explain what the property represents. No implementation details.
   */
  description: string;

  /**
   * Schema definition for the new property.
   *
   * Must be consistent with `specification`. Inline objects forbidden;
   * use `$ref` for nested structures.
   */
  schema: Exclude<AutoBeOpenApi.IJsonSchema, AutoBeOpenApi.IJsonSchema.IObject>;

  /** Whether property should be in `required` array. */
  required: boolean;
}
