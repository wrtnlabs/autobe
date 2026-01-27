/**
 * Update documentation and metadata of an existing property without changing its
 * type structure.
 *
 * Use when the property's JSON Schema type is already correct, but the
 * documentation fields are missing, incomplete, or incorrect.
 *
 * Common use cases:
 *
 * - Adding missing `databaseSchemaProperty` mapping for DB-backed properties
 * - Correcting wrong `databaseSchemaProperty` value (e.g., `"user_id"` → `"customer_id"`)
 * - Writing or revising `specification` instructions for downstream agents
 * - Improving or fixing inaccurate `description` for Swagger UI
 * - Documenting computed or aggregated properties (where `databaseSchemaProperty`
 *   is `null` and `specification` explains the computation logic)
 *
 * **Key difference from `update`**: This type ONLY modifies documentation
 * fields. Use `update` when you need to change the property's JSON Schema type.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyDepict {
  /** Discriminator for property revision type. */
  type: "depict";

  /**
   * Reason for updating the documentation.
   *
   * Explain what documentation was missing or incorrect and why the new values
   * are appropriate.
   */
  reason: string;

  /** Property key to update documentation for. */
  key: string;

  /**
   * Database schema property name this property maps to.
   *
   * Use the exact property name from the Prisma schema (e.g., `"customer_id"`,
   * `"created_at"` for columns, `"orders"` for relations).
   *
   * Set to `null` for properties that don't directly map to a database schema property:
   *
   * - Computed/aggregated values (e.g., `totalPrice`, `averageRating`)
   * - Derived fields from business logic
   *
   * When `null`, the `specification` field becomes CRITICAL for downstream
   * agents to understand how to implement this property.
   */
  databaseSchemaProperty: string | null;

  /**
   * Implementation specification for downstream agents (Realize, Test phases).
   *
   * This is internal documentation that guides code generation. Include:
   *
   * - Data source: Which DB column, relation, or computation provides the value
   * - Transformation logic: Any formatting, calculation, or derivation steps
   * - Validation rules: Constraints beyond what JSON Schema expresses
   * - Edge cases: How to handle nulls, empty values, or special conditions
   *
   * **CRITICAL when `databaseSchemaProperty` is `null`**: For computed/aggregated
   * properties, this is the ONLY guidance downstream agents have. Be explicit
   * about the computation formula, data sources, and expected behavior.
   */
  specification: string;

  /**
   * Public API documentation shown in Swagger UI.
   *
   * This is user-facing documentation for API consumers. Write clear, concise
   * descriptions that explain:
   *
   * - What the property represents in business terms
   * - Valid value ranges or formats (if applicable)
   * - Relationship to other properties (if meaningful)
   *
   * Avoid implementation details - those belong in `specification`.
   */
  description: string;
}
