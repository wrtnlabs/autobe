/**
 * Planning result for a single transformer function that will be generated.
 *
 * Represents a transformer planning decision made during the
 * REALIZE_TRANSFORMER_PLAN phase. Each plan specifies which response DTO
 * requires a transformer module and which Prisma table it maps to for database
 * query operations.
 *
 * Transformers convert Prisma query results into API response DTOs, handling
 * field mapping, nested object transformations, and proper select/include
 * specifications. The planning phase determines which DTOs are transformable
 * (Read DTO + DB-backed + Direct mapping) and which are not.
 *
 * This planning information is consumed by the REALIZE_TRANSFORMER_WRITE phase
 * to generate actual TypeScript transformer modules with type-safe transform()
 * and select() functions.
 *
 * @author Samchon
 */
export interface AutoBeRealizeTransformerPlan {
  /** Type discriminator for plan kind. */
  type: "transformer";

  /**
   * Response DTO type name for which the transformer will be generated.
   *
   * The TypeScript interface name representing the API response structure that
   * this transformer will produce from Prisma query results.
   *
   * Example: "IShoppingSale", "IBbsArticle", "IShoppingSale.ISummary"
   */
  dtoTypeName: string;

  /**
   * Chain of thought explaining the planning decision.
   *
   * Documents why this transformer is needed, what Prisma table it maps to, and
   * any notable transformation logic (nested transformers, field mappings,
   * etc.).
   *
   * Example: "Transforms shopping_sales to IShoppingSale with category and tags
   * relations"
   */
  thinking: string;

  /**
   * Prisma table name this transformer maps to.
   *
   * The source database table for this response DTO. The transformer's
   * transform() function will consume Prisma query results from this table and
   * the select() function will specify fields to load.
   *
   * Example: "shopping_sales", "bbs_articles", "shopping_categories"
   */
  databaseSchemaName: string;
}
