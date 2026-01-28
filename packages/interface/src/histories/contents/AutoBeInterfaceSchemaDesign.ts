import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * Design structure for creating OpenAPI schema components.
 *
 * Separates schema metadata from the actual JSON Schema definition, allowing
 * clear organization of implementation details (`specification`), API
 * documentation (`description`), and the type structure (`schema`).
 *
 * The design will be transformed into a complete `IJsonSchemaDescriptive` by
 * merging these fields appropriately.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaDesign {
  /**
   * Database model name that this schema maps to.
   *
   * Specifies which database table/model this DTO type corresponds to. Creates
   * a traceable link between API types and database entities.
   *
   * - Set to the exact model name (e.g., `"shopping_customers"`,
   *   `"bbs_articles"`) when this schema directly represents or derives from a
   *   database entity
   * - Set to `null` for:
   *
   *   - Computed/aggregated types (e.g., statistics, summaries from multiple
   *       tables)
   *   - Pure request parameter types (e.g., search filters, pagination)
   *   - Embedded JSON structures without dedicated tables
   *
   * When `null`, the `specification` field becomes critical for downstream
   * agents to understand how to implement data retrieval or computation.
   */
  databaseSchema: string | null;

  /**
   * Implementation specification for downstream agents.
   *
   * Detailed guidance on HOW to implement data retrieval, transformation, or
   * computation for this type. Internal documentation for Realize Agent, Test
   * Agent, and other implementation agents - NOT exposed in public API docs.
   *
   * **When `databaseSchema` is set** (direct mapping):
   *
   * - Can be brief for simple cases
   * - Focus on any non-obvious mapping details
   *
   * **When `databaseSchema` is `null`** (computed/aggregated types):
   *
   * This field is CRITICAL. Must include:
   *
   * - Source tables and columns involved
   * - JOIN conditions between tables
   * - Aggregation formulas (SUM, COUNT, AVG, etc.)
   * - Business rules and transformation logic
   * - Edge cases (nulls, empty sets, defaults)
   *
   * Must be precise enough for downstream agents to implement the actual data
   * retrieval or computation. Vague specifications are unacceptable.
   */
  specification: string;

  /**
   * API documentation for consumers.
   *
   * Standard OpenAPI description displayed in Swagger UI, SDK documentation,
   * and other API documentation tools. Focus on explaining WHAT the type
   * represents and WHY it exists from an API consumer's perspective.
   *
   * Guidelines:
   *
   * - Reference corresponding database schema documentation for consistency
   * - Organize into multiple paragraphs for complex types
   * - Focus on business meaning, relationships, and constraints
   * - Keep accessible to API consumers (no implementation details)
   * - MUST be written in English
   */
  description: string;

  /**
   * JSON Schema definition for the type.
   *
   * The actual type structure following OpenAPI v3.1 JSON Schema specification.
   * Can be any valid JSON Schema type: object, array, string, number, integer,
   * boolean, oneOf, or $ref.
   *
   * Important:
   *
   * - For union types, use `oneOf` - NEVER use array notation in `type` field
   * - For nullable types, use `oneOf: [{ type: "..." }, { type: "null" }]`
   * - Object properties should have clear, descriptive names in camelCase
   * - Use `$ref` for referencing other named schemas
   */
  schema: AutoBeOpenApi.IJsonSchema;
}
