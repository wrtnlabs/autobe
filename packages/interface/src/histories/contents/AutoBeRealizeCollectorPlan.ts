import { AutoBeRealizeCollectorReference } from "./AutoBeRealizeCollectorReference";

/**
 * Planning result for a single collector function that will be generated.
 *
 * Represents a collector planning decision made during the
 * REALIZE_COLLECTOR_PLAN phase. Each plan specifies which Create DTO requires a
 * collector module and which Prisma table it maps to for database insertion
 * operations.
 *
 * Collectors transform API request DTOs into Prisma CreateInput structures,
 * handling UUID generation, nested relationships, and proper connect/create
 * syntax. The planning phase determines which DTOs are collectable (Create DTO
 *
 * - DB-backed + Direct mapping) and which are not.
 *
 * This planning information is consumed by the REALIZE_COLLECTOR_WRITE phase to
 * generate actual TypeScript collector modules with type-safe collect()
 * functions.
 *
 * @author Samchon
 */
export interface AutoBeRealizeCollectorPlan {
  /** Type discriminator for plan kind. */
  type: "collector";

  /**
   * Create DTO type name for which the collector will be generated.
   *
   * The TypeScript interface name representing the API request body structure
   * that this collector will transform into Prisma input.
   *
   * Example: "IShoppingSale.ICreate", "IBbsArticle.ICreate"
   */
  dtoTypeName: string;

  /**
   * Chain of thought explaining the planning decision.
   *
   * Documents why this collector is needed, what Prisma table it maps to, and
   * any notable transformation logic (nested creates, foreign key handling,
   * etc.).
   *
   * Example: "Collects IShoppingSale.ICreate to shopping_sales with nested tags
   * and category connect"
   */
  thinking: string;

  /**
   * Prisma table name this collector maps to.
   *
   * The target database table for this Create DTO. The collector's collect()
   * function will return a Prisma CreateInput type for this table.
   *
   * Example: "shopping_sales", "bbs_articles", "shopping_sale_tags"
   */
  prismaSchemaName: string;

  /**
   * Foreign key references from path parameters or auth context.
   *
   * Lists entities that must be resolved and passed to the collector's
   * collect() function as IEntity parameters. These provide foreign key
   * relationships not present in the Create DTO body itself.
   *
   * Sources include URL path parameters (e.g., saleId) and authentication
   * context (logged-in user actor + session). Each reference becomes an IEntity
   * parameter in the generated collector.
   *
   * Empty array means the Create DTO contains all necessary references.
   *
   * Example: [{ prismaSchemaName: "shopping_sales", source: "from path
   * parameter saleId" }]
   */
  references: AutoBeRealizeCollectorReference[];
}
