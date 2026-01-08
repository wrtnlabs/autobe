import { SnakeCasePattern } from "../../typings/SnakeCasePattern";

/**
 * Request to create a new table in the component.
 *
 * Use this when you identify a missing table that should exist based on
 * requirements analysis. Common scenarios:
 *
 * - A required table was accidentally omitted from initial generation
 * - A use case requires a table that wasn't initially identified
 * - Review reveals gaps in data coverage for specific requirements
 * - Supporting tables needed (snapshots, settings, attachments, etc.)
 *
 * @author Michael
 */
export interface AutoBeDatabaseComponentTableCreate {
  /** Type discriminator indicating this is a create operation. */
  type: "create";

  /**
   * Reason for creating this table.
   *
   * Explain which requirement this table fulfills and why it was missing from
   * the initial generation.
   *
   * @example
   *   "Requirement 3.2 specifies order cancellation tracking, but no
   *   table exists to store cancellation records with reasons and timestamps."
   */
  reason: string;

  /**
   * The new table name to add.
   *
   * Must follow snake_case naming convention with appropriate domain prefix.
   */
  table: string & SnakeCasePattern;

  /**
   * Description of what this table stores.
   *
   * Explain the business purpose and what data this table will contain.
   *
   * @example
   *   "Stores order cancellation records including cancellation reason,
   *   timestamp, refund status, and reference to the original order."
   */
  description: string;
}
