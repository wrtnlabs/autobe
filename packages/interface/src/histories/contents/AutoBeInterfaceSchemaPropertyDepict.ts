/**
 * Update documentation of an existing property without changing its type.
 *
 * Use when the JSON Schema type is correct but documentation fields
 * (`databaseSchemaProperty`, `specification`, `description`) need fixing.
 *
 * If you discover the schema type is wrong while writing specification, use
 * `update` instead.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyDepict {
  /** Property key to update documentation for. */
  key: string;

  /**
   * Database schema property this maps to, or `null` for computed properties.
   *
   * When `null`, `specification` must explain the computation logic.
   */
  databaseSchemaProperty: string | null;

  /**
   * Evidence and reasoning for documentation update.
   *
   * Describe what was missing or incorrect.
   */
  reason: string;

  /** Discriminator for property revision type. */
  type: "depict";

  /**
   * Implementation guidance for downstream agents.
   *
   * Internal documentation for Realize/Test agents. When
   * `databaseSchemaProperty` is `null`, this must fully explain the computation
   * logic.
   */
  specification: string;

  /**
   * API documentation for consumers (Swagger UI).
   *
   * Explain what the property represents. No implementation details.
   */
  description: string;
}
