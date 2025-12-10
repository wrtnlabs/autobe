import { tags } from "typia";

/**
 * Request to retrieve Prisma database schema definitions for context.
 *
 * This type is used in the preliminary phase to request specific Prisma table
 * schemas needed for generating type-safe API operations.
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryGetPrismaSchemas {
  /**
   * Type discriminator for the request.
   *
   * Determines which action to perform: preliminary data retrieval or actual
   * task execution. Value "getPrismaSchemas" indicates this is a preliminary
   * data request for Prisma schemas.
   */
  type: "getPrismaSchemas";

  /**
   * List of Prisma table names to retrieve.
   *
   * Table names from the Prisma schema file representing database entities
   * (e.g., "user", "post", "comment").
   *
   * CRITICAL: DO NOT request the same schema names that you have already
   * requested in previous calls.
   */
  schemaNames: string[] & tags.MinItems<1>;
}
