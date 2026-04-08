import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * Design structure for creating an OpenAPI schema component.
 *
 * Separates schema metadata (specification, description) from the JSON Schema
 * definition (schema).
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaDesign {
  /**
   * Database model name this schema maps to, or `null` for computed/aggregated
   * types.
   *
   * When `null`, `specification` becomes critical for downstream agents.
   */
  databaseSchema: string | null;

  /**
   * Implementation guidance for downstream agents (Realize, Test). NOT exposed
   * in public API docs.
   *
   * When `databaseSchema` is set: brief mapping details. When `null`: MUST
   * include source tables, JOINs, aggregation formulas, business rules, and
   * edge cases.
   */
  specification: string;

  /**
   * API documentation for consumers (Swagger UI). Focus on WHAT the type
   * represents, referencing DB schema documentation for consistency.
   *
   * Format: summary sentence first, `\n\n`, then paragraphs grouped by topic.
   *
   * > MUST be written in English.
   */
  description: string;

  /**
   * JSON Schema definition.
   *
   * For union/nullable types, use `oneOf` — NEVER array in `type` field. Use
   * `$ref` for referencing named schemas. Object property names in camelCase.
   */
  schema: AutoBeOpenApi.IJsonSchema;
}
