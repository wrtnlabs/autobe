import { AutoBeRealizeCollectorReference } from "./AutoBeRealizeCollectorReference";

/**
 * Planning result for a single collector that will be generated.
 *
 * Contains all information needed to generate a collector module in the
 * REALIZE_COLLECTOR_WRITE phase.
 */
export interface AutoBeRealizeCollectorPlan {
  /** Type discriminator for plan kind. */
  kind: "collector";

  /**
   * DTO type name for which the collector will be generated.
   *
   * Example: "IShoppingSale.ICreate", "IBbsArticle.ICreate"
   */
  dtoTypeName: string;

  /**
   * Chain of thought explaining the planning decision.
   *
   * Documents why this collector is needed and what Prisma table it maps to.
   *
   * Example: "Collects IShoppingSale.ICreate to shopping_sales with nested
   * category"
   */
  thinking: string;

  /**
   * Prisma schema name (table name) this collector maps to.
   *
   * The target database table for this Create DTO.
   *
   * Example: "shopping_sales", "bbs_articles"
   */
  prismaSchemaName: string;

  /**
   * Referenced entities from path parameters or auth context.
   *
   * When a Create DTO doesn't contain all foreign key references needed to
   * create the Prisma record, those references must come from either:
   *
   * 1. **Path parameters**: Entity identifiers in the URL path
   * 2. **Auth context**: Logged-in user information from authentication
   *
   * This field lists the Prisma schema names AND sources of entities that will
   * be resolved and passed to the collector.
   *
   * Each reference becomes an `IEntity` parameter in the collector's
   * `collect()` function, providing the resolved entity's UUID.
   *
   * **Reference structure**:
   *
   * Each reference contains:
   * - `prismaSchemaName`: The Prisma table name (e.g., "shopping_sales")
   * - `source`: Where the reference comes from (e.g., "from path parameter
   *   saleId")
   *
   * **Source formats**:
   * - "from path parameter {paramName}" - URL path parameter
   * - "from authorized actor" - Logged-in user entity
   * - "from authorized session" - Current user session entity
   *
   * **How references are extracted**:
   *
   * **From path parameters** (`AutoBeOpenApi.IOperation.parameters`):
   *
   * - `saleId` (UUID PK) → resolved to `shopping_sales` entity → becomes `sale:
   *   IEntity` parameter
   *   - Source: "from path parameter saleId"
   * - `categoryCode` (UK) → resolved to `bbs_categories` entity → becomes
   *   `category: IEntity` parameter
   *   - Source: "from path parameter categoryCode"
   *
   * **From auth context** (logged-in user):
   *
   * - Authorized actor provides **TWO entities**: actor + session
   * - Actor: `shopping_customers`, `shopping_sellers`, `bbs_members` → becomes
   *   `customer: IEntity`, `seller: IEntity`, or `member: IEntity`
   *   - Source: "from authorized actor"
   * - Session: `shopping_customer_sessions`, `shopping_seller_sessions`,
   *   `bbs_member_sessions` → becomes `session: IEntity`
   *   - Source: "from authorized session"
   * - Common for operations where logged-in user is the resource owner
   *
   * **Example usage**:
   *
   * ```typescript
   * // If references = [
   * //   { prismaSchemaName: "shopping_sales", source: "from path parameter saleId" },
   * //   { prismaSchemaName: "shopping_customers", source: "from authorized actor" },
   * //   { prismaSchemaName: "shopping_customer_sessions", source: "from authorized session" }
   * // ]
   * export namespace ShoppingSaleReviewCollector {
   *   export async function collect(props: {
   *     body: IShoppingSaleReview.ICreate;
   *     sale: IEntity;      // from saleId path param
   *     customer: IEntity;  // from auth - logged-in customer
   *     session: IEntity;   // from auth - current session
   *   }) {
   *     return {
   *       shopping_sale_id: props.sale.id,      // UUID from path param
   *       customer_id: props.customer.id,       // UUID from auth actor
   *       session_id: props.session.id,         // UUID from auth session
   *       ...
   *     } satisfies Prisma.shopping_sale_reviewsCreateInput;
   *   }
   * }
   * ```
   *
   * **Why references are needed**:
   *
   * Path parameters and auth context provide foreign key relationships that
   * aren't in the Create DTO body.
   *
   * **Example 1 - Path parameter**:
   *
   * - Path: `/sales/{saleId}/reviews`
   * - Body: `IShoppingSaleReview.ICreate` (doesn't contain saleId)
   * - Reference: `{ prismaSchemaName: "shopping_sales", source: "from path
   *   parameter saleId" }`
   *
   * **Example 2 - Auth context**:
   *
   * - Path: `/articles` (no path parameters)
   * - Body: `IBbsArticle.ICreate` (doesn't contain author information)
   * - Auth: Logged-in member
   * - References:
   *   - `{ prismaSchemaName: "bbs_members", source: "from authorized actor" }`
   *   - `{ prismaSchemaName: "bbs_member_sessions", source: "from authorized
   *     session" }`
   *
   * Empty array means the Create DTO contains all necessary references.
   */
  references: AutoBeRealizeCollectorReference[];
}
