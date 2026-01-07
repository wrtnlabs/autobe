/**
 * Request to erase a table from the component.
 *
 * Use this when a table should be removed from the component:
 *
 * - Table belongs to a different domain/component
 * - Duplicate functionality with another table
 * - Not derived from actual requirements (hallucinated)
 * - Table is unnecessary for the business requirements
 * - Over-engineering (unnecessary granularity)
 *
 * @author Michael
 */
export interface AutoBeDatabaseComponentTableErase {
  /** Type discriminator indicating this is an erase operation. */
  type: "erase";

  /**
   * Reason for deletion.
   *
   * Explain why this table should be removed and what issue it causes.
   *
   * @example
   *   "Table 'shopping_customers' belongs to the Actors component,
   *   not the Orders component. It should be removed to maintain proper
   *   domain separation."
   */
  reason: string;

  /**
   * The table name to remove.
   *
   * Must be from the current component's table list. Must match exactly.
   */
  table: string;
}
