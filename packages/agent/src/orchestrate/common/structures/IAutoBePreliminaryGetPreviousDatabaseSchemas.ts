import { tags } from "typia";

/**
 * Request to retrieve database schemas from the previous iteration.
 *
 * Loads database table definitions from the last successfully generated
 * version, used as reference context during regeneration or modification
 * cycles.
 */
export interface IAutoBePreliminaryGetPreviousDatabaseSchemas {
  /** Type discriminator. */
  type: "getPreviousDatabaseSchemas";

  /**
   * Table names to retrieve from previous iteration. DO NOT request same names
   * already requested in previous calls.
   */
  schemaNames: string[] & tags.MinItems<1>;
}
