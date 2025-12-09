import { tags } from "typia";

/**
 * Request to re-retrieve previously requested Prisma schemas for context.
 *
 * This type is used in the preliminary phase to re-request Prisma database
 * schema definitions that were already fetched in previous iterations within
 * the same orchestration task. Unlike `IAutoBePreliminaryGetPrismaSchemas`
 * which retrieves NEW schemas from the global state, this retrieves schemas
 * from the LOCAL context that were previously requested.
 *
 * **Use Case:** When an agent needs to access Prisma table schemas across
 * multiple RAG iterations, it may need to re-request schemas from earlier
 * iterations to maintain database context. This is particularly useful in:
 *
 * - Interface complement cycles that need database schema references
 * - Realize operations that regenerate based on Prisma models
 * - Validation passes that verify consistency with database structure
 *
 * **Key Difference from Regular `getPrismaSchemas`:**
 *
 * - Regular: Fetches NEW schemas from global state (not yet in local context)
 * - GetPrevious: Re-fetches schemas ALREADY in local context from prior requests
 *
 * **Example Scenario:**
 *
 * 1. First iteration: Agent requests `["user", "post"]` via `getPrismaSchemas`
 * 2. Second iteration: Agent needs "user" schema again → use
 *    `getPreviousPrismaSchemas`
 * 3. This avoids duplicate request errors and maintains context efficiently
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryGetPreviousPrismaSchemas {
  /**
   * Type discriminator for the request.
   *
   * Determines which action to perform: preliminary data retrieval or actual
   * task execution. Value "getPreviousPrismaSchemas" indicates this is a
   * preliminary data request for previously requested Prisma schemas.
   */
  type: "getPreviousPrismaSchemas";

  /**
   * List of Prisma table names to re-retrieve from previous requests.
   *
   * Schema names that were already requested in previous iterations within this
   * orchestration task. These schemas should exist in the local context.
   *
   * **Important Notes:**
   *
   * - These schema names MUST have been requested in a previous iteration
   * - Requesting non-existent or never-before-requested schemas will fail
   * - Use this to maintain database context across multiple RAG cycles
   * - Prefer this over `getPrismaSchemas` when you need to re-access known
   *   schemas
   * - Table names are in snake_case (e.g., "shopping_sale", "bbs_article")
   */
  schemaNames: string[] & tags.MinItems<1>;
}
