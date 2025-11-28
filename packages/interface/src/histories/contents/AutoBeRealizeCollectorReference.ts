/**
 * Reference to an external entity needed by a collector function.
 *
 * When a Create DTO doesn't contain all foreign key references needed to create
 * the Prisma record, those references come from either path parameters or auth
 * context. This interface tracks both the Prisma schema name and the source of
 * the reference.
 *
 * The source field indicates where the reference originates:
 *
 * - "from path parameter X" - Entity identifier from URL path (e.g., saleId)
 * - "from authorized actor" - Logged-in user entity (customer/seller/member)
 * - "from authorized session" - Current user session entity
 *
 * Each reference becomes an `IEntity` parameter in the collector's `collect()`
 * function signature.
 *
 * @author Samchon
 */
export interface AutoBeRealizeCollectorReference {
  /**
   * Prisma schema name (table name) of the referenced entity.
   *
   * Examples: "shopping_sales", "shopping_customers", "bbs_members"
   */
  prismaSchemaName: string;

  /**
   * Source of this reference, describing where it originates.
   *
   * Possible formats:
   *
   * - "from path parameter {paramName}" - URL path parameter (e.g., "from path
   *   parameter saleId")
   * - "from authorized actor" - Logged-in user entity
   * - "from authorized session" - Current user session entity
   */
  source: string;
}
