/**
 * DTO type name refactoring operation.
 *
 * Fixes names violating the rule: ALL words from the Prisma table name MUST be
 * preserved. The orchestrator automatically renames all variants (.ICreate,
 * .IUpdate, .ISummary, IPage*).
 *
 * Common violations: `ISale` → `IShoppingSale` (prefix omission), `IBbsComment`
 * → `IBbsArticleComment` (intermediate word omission).
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaRefactor {
  /**
   * Current INCORRECT base type name (e.g., "ISale" when table is
   * "shopping_sales").
   */
  from: string;

  /**
   * CORRECT base type name preserving ALL table words as PascalCase with "I"
   * prefix (e.g., "IShoppingSale").
   */
  to: string;
}
