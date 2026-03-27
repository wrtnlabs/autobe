/**
 * External entity reference needed by a collector function.
 *
 * FK references not in the Create DTO come from path parameters or auth
 * context. Each becomes an `IEntity` parameter in the collector's `collect()`
 * signature.
 *
 * @author Samchon
 */
export interface AutoBeRealizeCollectorReference {
  /** Prisma table name (e.g., "shopping_sales", "shopping_customers"). */
  databaseSchemaName: string;

  /**
   * Source of this reference:
   *
   * - "from path parameter {paramName}" — URL path parameter
   * - "from authorized actor" — logged-in user entity
   * - "from authorized session" — current session entity
   */
  source: string;
}
