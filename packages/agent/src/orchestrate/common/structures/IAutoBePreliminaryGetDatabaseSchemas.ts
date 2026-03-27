import { tags } from "typia";

/** Request to retrieve database schema definitions for context. */
export interface IAutoBePreliminaryGetDatabaseSchemas {
  /** Type discriminator. */
  type: "getDatabaseSchemas";

  /**
   * Database table names to retrieve. DO NOT request same names already
   * requested in previous calls.
   */
  schemaNames: string[] & tags.MinItems<1>;
}
