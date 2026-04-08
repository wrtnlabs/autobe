import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * Design structure for casting a degenerate primitive type to an object schema.
 *
 * Used when a primitive alias (e.g., `type IPreferences = string`) needs
 * correction to a proper object schema based on JSDoc, DB hints, and naming.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaCasting {
  /**
   * Database model name after casting, or `null` for embedded/computed types.
   *
   * When `null`, `specification` becomes critical for downstream agents.
   */
  databaseSchema: string | null;

  /**
   * Implementation guidance for downstream agents. NOT exposed in public API
   * docs.
   *
   * When `databaseSchema` is set: brief mapping details. When `null`: MUST
   * include source tables, parsing/serialization requirements, validation
   * rules, and edge cases.
   */
  specification: string;

  /**
   * API documentation for consumers (Swagger UI). Focus on WHAT the corrected
   * type represents. No implementation details.
   *
   * Format: summary sentence first, `\n\n`, then paragraphs grouped by topic.
   *
   * > MUST be written in English.
   */
  description: string;

  /**
   * Corrected object schema replacing the degenerate primitive. MUST be an
   * object schema with properties and required array.
   */
  schema: AutoBeOpenApi.IJsonSchema.IObject;
}
