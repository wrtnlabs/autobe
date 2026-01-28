import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * Add a new property to a DTO schema.
 *
 * Use when a property is missing from the schema but should exist. Common cases:
 *
 * - **Missing database field**: A column exists in the database but wasn't
 *   included in the DTO
 * - **Missing relation reference**: A relationship (belongs-to, has-many) needs
 *   to be exposed via `$ref`
 * - **Missing computed property**: A derived/aggregated value (e.g.,
 *   `totalOrders`, `averageRating`) should be included
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyCreate {
  /** Discriminator for property revision type. */
  type: "create";

  /** Reason for adding this property. */
  reason: string;

  /** Property key to add. */
  key: string;

  /**
   * Database schema property name that this property maps to.
   *
   * Specifies which database schema property (column or relation) this property
   * corresponds to. Creates a traceable link between DTO properties and
   * database schema properties.
   *
   * - Set to the exact property name (e.g., `"created_at"`, `"customer_id"` for
   *   columns, `"orders"` for relations) when this property directly maps to
   *   a database schema property
   * - Set to `null` for:
   *
   *   - Computed/derived properties (e.g., `totalOrders`, `averageRating`)
   *   - Virtual properties not stored in database
   *
   * When `null`, the `specification` field becomes critical for downstream
   * agents to understand how to implement data retrieval or computation.
   */
  databaseSchemaProperty: string | null;

  /**
   * Implementation specification for downstream agents.
   *
   * Detailed guidance on HOW to implement data retrieval, transformation, or
   * computation for this property. Internal documentation for Realize Agent
   * and Test Agent - NOT exposed in public API documentation.
   *
   * **When `databaseSchemaProperty` is set** (direct mapping):
   *
   * - Can be brief (e.g., "Direct mapping from users.created_at column.")
   * - Focus on any type conversion or formatting details
   *
   * **When `databaseSchemaProperty` is `null`** (computed/derived):
   *
   * This field is CRITICAL. Must include:
   *
   * - Source tables and columns involved
   * - JOIN conditions for relation references
   * - Aggregation formulas (SUM, COUNT, AVG, etc.)
   * - Business rules and transformation logic
   * - Edge cases (nulls, empty sets, defaults)
   *
   * Must be precise enough for downstream agents to implement the actual
   * data retrieval or computation. Vague specifications are unacceptable.
   */
  specification: string;

  /**
   * API documentation for consumers.
   *
   * Standard OpenAPI description displayed in Swagger UI, SDK documentation,
   * and other API documentation tools. Focus on explaining WHAT this property
   * represents from an API consumer's perspective.
   *
   * Guidelines:
   *
   * - Reference corresponding database schema property documentation for consistency
   * - Explain business meaning and constraints
   * - Keep accessible to API consumers (no implementation details)
   * - MUST be written in English
   */
  description: string;

  /**
   * Schema definition for the new property.
   *
   * **IMPORTANT: Inline object types are NOT allowed.**
   *
   * For nested object structures, use `$ref` to reference a named schema:
   *
   * - ✅ `{ "$ref": "#/components/schemas/ICustomer.ISummary" }`
   * - ✅ `{ "type": "array", "items": { "$ref": "#/components/schemas/IOrderItem" } }`
   * - ❌ `{ "type": "object", "properties": { ... } }` - FORBIDDEN
   *
   * Allowed types: string, number, integer, boolean, null, const, array, oneOf, $ref
   */
  schema: Exclude<AutoBeOpenApi.IJsonSchema, AutoBeOpenApi.IJsonSchema.IObject>;

  /** Whether property should be in `required` array. */
  required: boolean;
}
