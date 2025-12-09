import { tags } from "typia";

/**
 * Request to re-retrieve previously requested interface schemas for context.
 *
 * This type is used in the preliminary phase to re-request OpenAPI schema
 * definitions (from components.schemas) that were already fetched in previous
 * iterations within the same orchestration task. Unlike
 * `IAutoBePreliminaryGetInterfaceSchemas` which retrieves NEW schemas from the
 * global state, this retrieves schemas from the LOCAL context that were
 * previously requested.
 *
 * **Use Case:** When an agent needs to access DTO schemas across multiple RAG
 * iterations, it may need to re-request schemas from earlier iterations to
 * maintain type context. This is particularly useful in:
 *
 * - Interface complement cycles that need to reference existing schemas
 * - Schema validation passes that check consistency across DTOs
 * - Operation generation that needs complete DTO definitions
 * - Correction cycles that regenerate schemas with proper context
 *
 * **Key Difference from Regular `getInterfaceSchemas`:**
 *
 * - Regular: Fetches NEW schemas from global state (not yet in local context)
 * - GetPrevious: Re-fetches schemas ALREADY in local context from prior requests
 *
 * **Example Scenario:**
 *
 * 1. First iteration: Agent requests `["IUser", "IUser.ICreate"]` via
 *    `getInterfaceSchemas`
 * 2. Schemas and their $ref dependencies are automatically loaded
 * 3. Second iteration: Agent needs "IUser" schema again � use
 *    `getPreviousInterfaceSchemas`
 * 4. This avoids duplicate request errors and maintains schema context efficiently
 *
 * **Automatic Dependency Loading:** When schemas are re-requested, their
 * referenced schemas (via `$ref`) are automatically included from the local
 * context as well, maintaining complete type dependency graphs.
 *
 * **Schema Type Naming Convention:**
 *
 * - Entity schemas: `IEntityName` (e.g., "IUser", "IPost", "IShoppingSale")
 * - Nested DTOs: `IEntityName.ISubType` (e.g., "IUser.ICreate", "IPost.IUpdate")
 * - Response wrappers: `IPage<IEntityName>` (e.g., "IPageIUser", "IPageIPost")
 * - Summary types: `IEntityName.ISummary` (e.g., "IBbsArticle.ISummary")
 * - Authorized types: `IEntityName.IAuthorized` (e.g., "IUser.IAuthorized")
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryGetPreviousInterfaceSchemas {
  /**
   * Type discriminator for the request.
   *
   * Determines which action to perform: preliminary data retrieval or actual
   * task execution. Value "getPreviousInterfaceSchemas" indicates this is a
   * preliminary data request for previously requested interface schemas.
   */
  type: "getPreviousInterfaceSchemas";

  /**
   * List of schema type names to re-retrieve from previous requests.
   *
   * Type names from the OpenAPI components.schemas section that were already
   * requested in previous iterations within this orchestration task. These
   * schemas should exist in the local context.
   *
   * **Important Notes:**
   *
   * - These type names MUST have been requested in a previous iteration
   * - Requesting non-existent or never-before-requested schemas will fail
   * - Use this to maintain schema context across multiple RAG cycles
   * - Prefer this over `getInterfaceSchemas` when you need to re-access known
   *   schemas
   * - Type names follow TypeScript interface naming (e.g., "IUser",
   *   "IUser.ICreate")
   *
   * **Type Name Examples:**
   *
   * - Base entity: "IShoppingSale", "IBbsArticle", "IUser"
   * - Create DTO: "IShoppingSale.ICreate", "IBbsArticle.ICreate"
   * - Update DTO: "IShoppingSale.IUpdate", "IUser.IUpdate"
   * - Paginated: "IPageIShoppingSale", "IPageIBbsArticle"
   * - Summary: "IShoppingSale.ISummary", "IBbsArticle.ISummary"
   */
  typeNames: string[] & tags.MinItems<1>;
}
