import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * Replace an existing property's schema definition.
 *
 * Use when the property exists but its type, format, or structure is incorrect.
 * Common cases:
 *
 * - **Wrong type**: Property is `string` but should be `integer`
 * - **Missing format**: Date field lacks `format: "date-time"`
 * - **FK to object**: Foreign key (e.g., `customerId: string`) should become
 *   relation reference (e.g., `customer: { $ref: "..." }`) - use `newKey` for
 *   renaming
 * - **Wrong $ref**: Property references incorrect schema type
 *
 * For nullability-only changes (adding/removing null wrapper), use `nullish`
 * instead - it's more precise and preserves the existing schema structure.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyUpdate {
  /** Discriminator for property revision type. */
  type: "update";

  /** Reason for replacing this property's schema. */
  reason: string;

  /** Current property key to update. */
  key: string;

  /**
   * New property key after update.
   *
   * - `null`: Keep the same key
   * - `string`: Rename property (used for FK-to-object transformation)
   */
  newKey: string | null;

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
   * New schema definition that replaces the existing one.
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
