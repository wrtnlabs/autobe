import { tags } from "typia";

/**
 * Request to retrieve Prisma schemas from a previous version.
 *
 * This type is used to load Prisma database schema definitions that were
 * generated in a **previous version** of the AutoBE generation pipeline.
 * This is NOT about re-requesting schemas within the same execution, but rather
 * accessing artifacts from an earlier version.
 *
 * **Use Case:** When regenerating or modifying the database schema based on
 * user change requests, agents need to reference the previously generated
 * Prisma schemas to understand the existing database structure and what needs
 * to be modified.
 *
 * **Key Difference from `getPrismaSchemas`:**
 *
 * - `getPrismaSchemas`: Fetches schemas from the **current version**
 *   (the version being generated right now)
 * - `getPreviousPrismaSchemas`: Fetches schemas from the **previous version**
 *   (the last successfully generated version)
 *
 * **Example Scenario:**
 *
 * ```
 * Initial generation:
 * - PRISMA phase creates: users, posts, comments tables
 * - Generation completes successfully
 *
 * User: "Add email verification status to users"
 *
 * Regeneration:
 * - PRISMA phase starts regeneration
 * - Calls getPreviousPrismaSchemas(["users"])
 *   → Loads the previous version of users table schema
 * - Creates new version with emailVerified field added
 * ```
 *
 * **Waterfall + Spiral Pattern:**
 *
 * This aligns with AutoBE's regeneration cycles where:
 * - Compilation failures trigger regeneration with corrections
 * - User modifications trigger new versions
 * - Previous schemas serve as reference for incremental changes
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryGetPreviousPrismaSchemas {
  /**
   * Type discriminator for the request.
   *
   * Determines which action to perform: preliminary data retrieval or actual
   * task execution. Value "getPreviousPrismaSchemas" indicates this is a
   * preliminary data request for Prisma schemas from a previous version.
   */
  type: "getPreviousPrismaSchemas";

  /**
   * List of Prisma table names to retrieve from the previous version.
   *
   * These are table schema names that were generated in a previous version
   * and are needed as reference context for the current regeneration.
   *
   * **Important Notes:**
   *
   * - These schemas MUST exist in the previous version
   * - This function is only available when a previous version exists
   * - Used for reference/comparison, not for re-requesting within same execution
   * - Table names are in snake_case (e.g., "shopping_sale", "bbs_article")
   *
   * **When This Function is Available:**
   *
   * - When a previous version exists
   * - When user requests modifications to existing database schema
   * - During correction/regeneration cycles that need previous schema context
   *
   * **When This Function is NOT Available:**
   *
   * - During initial generation (no previous version exists)
   * - No previous Prisma schemas available for this orchestration task
   *
   * **Example Table Names:**
   *
   * - "users", "posts", "comments"
   * - "shopping_sales", "shopping_orders", "shopping_products"
   * - "bbs_articles", "bbs_article_files"
   */
  schemaNames: string[] & tags.MinItems<1>;
}
