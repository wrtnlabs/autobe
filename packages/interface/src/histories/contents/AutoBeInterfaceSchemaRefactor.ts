/**
 * Represents a DTO type name refactoring operation.
 *
 * This interface defines a single rename operation to fix DTO type names that
 * violate the critical naming convention: ALL words from the Prisma table name
 * MUST be preserved in the DTO type name.
 *
 * Common violations detected:
 * - Service prefix omission: `shopping_sales` → `ISale` (should be `IShoppingSale`)
 * - Intermediate word omission: `bbs_article_comments` → `IBbsComment` (should be `IBbsArticleComment`)
 * - Multiple words omitted: `shopping_order_good_refunds` → `IShoppingRefund` (should be `IShoppingOrderGoodRefund`)
 *
 * The orchestrator automatically handles renaming all related variants:
 * - Base type: `ISale` → `IShoppingSale`
 * - Create variant: `ISale.ICreate` → `IShoppingSale.ICreate`
 * - Update variant: `ISale.IUpdate` → `IShoppingSale.IUpdate`
 * - Summary variant: `ISale.ISummary` → `IShoppingSale.ISummary`
 * - Page type: `IPageISale` → `IPageIShoppingSale`
 *
 * @example
 * ```typescript
 * // Fix service prefix omission
 * { from: "ISale", to: "IShoppingSale" }
 *
 * // Fix intermediate word omission
 * { from: "IBbsComment", to: "IBbsArticleComment" }
 *
 * // Fix multiple omissions
 * { from: "IShoppingRefund", to: "IShoppingOrderGoodRefund" }
 * ```
 */
export interface AutoBeInterfaceSchemaRefactor {
  /**
   * Current INCORRECT type name that violates naming rules.
   *
   * This is the base type name (without variant suffixes or IPage prefix)
   * that omits service prefixes or intermediate components from the
   * Prisma table name.
   *
   * @example "ISale" (when table is "shopping_sales")
   * @example "IBbsComment" (when table is "bbs_article_comments")
   */
  from: string;

  /**
   * CORRECT type name with all components preserved.
   *
   * This is the proper base type name that preserves ALL words from the
   * Prisma table name, converted from snake_case to PascalCase with "I" prefix.
   *
   * @example "IShoppingSale" (from table "shopping_sales")
   * @example "IBbsArticleComment" (from table "bbs_article_comments")
   */
  to: string;
}
