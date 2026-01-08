import { SnakeCasePattern } from "../../typings/SnakeCasePattern";

/**
 * Request to update (rename) an existing table in the component.
 *
 * Use this when a table has naming issues that need correction:
 *
 * - Naming convention violations (e.g., `userProfile` -> `user_profiles`)
 * - Missing domain prefix (e.g., `orders` -> `shopping_orders`)
 * - Singular/plural normalization (e.g., `order` -> `orders`)
 * - Typos or unclear naming (e.g., `usr_data` -> `user_data`)
 * - Better alignment with domain terminology
 *
 * @author Michael
 */
export interface AutoBeDatabaseComponentTableUpdate {
  /** Type discriminator indicating this is an update operation. */
  type: "update";

  /**
   * Reason for this update.
   *
   * Explain what naming issue this fixes and why the new name is better.
   *
   * @example
   *   "Table name 'orderCancel' violates snake_case convention and
   *   should be renamed to 'order_cancellations' with proper pluralization."
   */
  reason: string;

  /**
   * The original table name to modify.
   *
   * Must be from the current component's table list. Must match exactly.
   */
  original: string & SnakeCasePattern;

  /**
   * The updated table name.
   *
   * Must follow snake_case naming convention with appropriate domain prefix.
   */
  updated: string & SnakeCasePattern;

  /**
   * Updated description of what this table stores.
   *
   * Provide a clear description for the renamed table.
   *
   * @example
   *   "Stores order cancellation records including cancellation reason,
   *   timestamp, refund status, and reference to the original order."
   */
  description: string;
}
