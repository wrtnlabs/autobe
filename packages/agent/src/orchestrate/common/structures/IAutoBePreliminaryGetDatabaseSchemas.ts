import { tags } from "typia";

/**
 * Request to retrieve database schema definitions for context.
 *
 * This type is used in the preliminary phase to request specific database table
 * schemas needed for generating type-safe API operations.
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryGetDatabaseSchemas {
  /**
   * Type discriminator for the request.
   *
   * Determines which action to perform: preliminary data retrieval or actual
   * task execution. Value "getDatabaseSchemas" indicates this is a preliminary
   * data request for database schemas.
   */
  type: "getDatabaseSchemas";

  /**
   * List of database table names to retrieve.
   *
   * Table names from the database schema representing database entities
   * (e.g., "user", "post", "comment").
   *
   * CRITICAL: DO NOT request the same schema names that you have already
   * requested in previous calls.
   */
  schemaNames: string[] & tags.MinItems<1>;
}
