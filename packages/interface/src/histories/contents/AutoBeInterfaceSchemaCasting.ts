import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * Design structure for casting primitive types to object schemas.
 *
 * Used when a degenerate primitive type alias (e.g., `type IPreferences =
 * string`) needs to be corrected to a proper object schema. The casting agent
 * analyzes JSDoc descriptions, database hints, and naming conventions to
 * determine the correct object structure.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaCasting {
  /**
   * Database model name that this schema maps to.
   *
   * Specifies which database table/model this DTO type corresponds to after
   * casting. Creates a traceable link between API types and database entities.
   *
   * - Set to the exact model name (e.g., `"shopping_customers"`,
   *   `"bbs_articles"`) when the corrected object schema represents a database
   *   entity
   * - Set to `null` for:
   *
   *   - Embedded JSON structures stored in a column without dedicated table
   *   - Computed objects derived from multiple sources
   *   - Pure configuration or parameter objects
   *
   * When `null`, the `specification` field becomes critical for downstream
   * agents to understand how to implement data retrieval or computation.
   */
  databaseSchema: string | null;

  /**
   * Implementation specification for downstream agents.
   *
   * Detailed guidance on HOW to implement data retrieval, transformation, or
   * computation for this corrected type. Internal documentation for Realize
   * Agent and Test Agent - NOT exposed in public API documentation.
   *
   * **When `databaseSchema` is set** (direct mapping):
   *
   * - Can be brief for simple cases
   * - Focus on parsing/serialization if stored as JSON column
   *
   * **When `databaseSchema` is `null`** (embedded/computed types):
   *
   * This field is CRITICAL. Must include:
   *
   * - How the data was previously stored (e.g., JSON string in DB column)
   * - Source tables and columns involved
   * - Parsing/serialization requirements
   * - Validation rules for the object structure
   * - Edge cases (nulls, empty objects, defaults)
   *
   * Must be precise enough for downstream agents to implement the actual data
   * retrieval or computation. Vague specifications are unacceptable.
   */
  specification: string;

  /**
   * API documentation for consumers.
   *
   * Standard OpenAPI description displayed in Swagger UI, SDK documentation,
   * and other API documentation tools. Focus on explaining WHAT the corrected
   * type represents from an API consumer's perspective.
   *
   * Guidelines:
   *
   * - Describe the object's purpose and structure clearly
   * - Document each property's meaning and constraints
   * - Organize into multiple paragraphs for complex types
   * - Keep accessible to API consumers (no implementation details)
   * - MUST be written in English
   */
  description: string;

  /**
   * Object schema definition for the corrected type.
   *
   * The corrected object structure that replaces the degenerate primitive type.
   * MUST be an object schema with proper properties and required array.
   *
   * When designing the object schema:
   *
   * - Analyze the original JSDoc/description for structural hints
   * - Look for keywords like "contains", "includes", "mapping", "key/value"
   * - Consider database JSON column structure if applicable
   * - Include all properties mentioned or implied in documentation
   * - Set appropriate `required` array based on business rules
   */
  schema: AutoBeOpenApi.IJsonSchema.IObject;
}
