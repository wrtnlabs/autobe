import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * Replace an existing property's schema definition.
 *
 * Use when type, format, or structure is wrong. For nullability-only changes,
 * use `nullish` instead.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyUpdate {
  /** Current property key to update. */
  key: string;

  /**
   * Database schema property this maps to, or `null` for computed properties.
   *
   * When `null`, `specification` must explain the computation logic.
   */
  databaseSchemaProperty: string | null;

  /**
   * Evidence and reasoning for schema replacement.
   *
   * Describe what is wrong with the current schema.
   */
  reason: string;

  /** Discriminator for property revision type. */
  type: "update";

  /**
   * New property key, or `null` to keep current key.
   *
   * Use for FK-to-object transformation (e.g., `author_id` to `author`).
   */
  newKey: string | null;

  /**
   * Implementation guidance for downstream agents.
   *
   * Internal documentation for Realize/Test agents. When
   * `databaseSchemaProperty` is `null`, this must fully explain the computation
   * logic.
   */
  specification: string;

  /**
   * API documentation for consumers (Swagger UI). Explain what the property
   * represents. No implementation details.
   *
   * Format: summary sentence first, `\n\n`, then paragraphs grouped by topic.
   */
  description: string;

  /**
   * New schema definition replacing the existing one.
   *
   * Must be consistent with `specification`. Inline objects forbidden; use
   * `$ref` for nested structures.
   */
  schema: Exclude<AutoBeOpenApi.IJsonSchema, AutoBeOpenApi.IJsonSchema.IObject>;

  /** Whether property should be in `required` array. */
  required: boolean;
}
