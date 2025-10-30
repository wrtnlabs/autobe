import { AutoBeInterfaceSchemaRefactor } from "../histories/contents/AutoBeInterfaceSchemaRefactor";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event emitted when DTO type names are validated and refactored for naming
 * compliance.
 *
 * This event is dispatched during the Interface phase when the Schema Rename
 * agent analyzes existing DTO type names against Prisma table names to detect
 * violations of the critical naming convention: ALL words from the Prisma table
 * name MUST be preserved in the DTO type name.
 *
 * The agent identifies type names that incorrectly omit service prefixes or
 * intermediate components and provides refactoring operations to fix them.
 *
 * Common violations detected:
 *
 * - Service prefix omission: `ISale` should be `IShoppingSale`
 * - Intermediate word omission: `IBbsComment` should be `IBbsArticleComment`
 * - Multiple words omitted: `IShoppingRefund` should be
 *   `IShoppingOrderGoodRefund`
 *
 * The orchestrator automatically applies these refactorings to:
 *
 * - Base types (e.g., `ISale`)
 * - All variants (e.g., `ISale.ICreate`, `ISale.IUpdate`, `ISale.ISummary`)
 * - Page types (e.g., `IPageISale`)
 * - All `$ref` references throughout the OpenAPI document
 *
 * @example
 *   ```typescript
 *   {
 *     type: "interfaceSchemaRename",
 *     id: "uuid-v7",
 *     refactors: [
 *       { from: "ISale", to: "IShoppingSale" },
 *       { from: "IBbsComment", to: "IBbsArticleComment" }
 *     ],
 *     total: 100,
 *     completed: 50,
 *     tokenUsage: { input: 1000, output: 200 },
 *     created_at: "2025-01-23T12:34:56.789Z"
 *   }
 *   ```;
 *
 * @see AutoBeInterfaceSchemaRefactor for individual refactoring operations
 */
export interface AutoBeInterfaceSchemaRenameEvent
  extends AutoBeEventBase<"interfaceSchemaRename">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * List of DTO type name refactoring operations to fix naming violations.
   *
   * Each refactor specifies a base type name that needs to be renamed from an
   * incorrect form (omitting words) to the correct form (preserving all table
   * name components).
   *
   * An empty array indicates no violations were detected - all type names
   * correctly preserve their table name components.
   *
   * @example
   *   ```typescript
   *   [
   *     { from: "ISale", to: "IShoppingSale" },
   *     { from: "IBbsComment", to: "IBbsArticleComment" },
   *     { from: "IShoppingRefund", to: "IShoppingOrderGoodRefund" }
   *   ]
   *   ```;
   */
  refactors: AutoBeInterfaceSchemaRefactor[];
}
