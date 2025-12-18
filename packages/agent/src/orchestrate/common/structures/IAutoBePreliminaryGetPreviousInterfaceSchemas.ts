import { tags } from "typia";

/**
 * Request to retrieve interface schemas from a previous version.
 *
 * This type is used to load OpenAPI schema definitions (DTOs from
 * components.schemas) that were generated in a **previous version** of the
 * AutoBE generation pipeline. This is NOT about re-requesting schemas within
 * the same execution, but rather accessing artifacts from an earlier version.
 *
 * **Use Case:** When regenerating or modifying API schemas based on user change
 * requests, agents need to reference the previously generated schemas to
 * understand the existing DTO structure and what needs to be modified.
 *
 * **Key Difference from `getInterfaceSchemas`:**
 *
 * - `getInterfaceSchemas`: Fetches schemas from the **current version**
 *   (the version being generated right now)
 * - `getPreviousInterfaceSchemas`: Fetches schemas from the **previous version**
 *   (the last successfully generated version)
 *
 * **Example Scenario:**
 *
 * ```
 * Initial generation:
 * - INTERFACE phase creates: IUser, IUser.ICreate, IUser.IUpdate, IPost
 * - Generation completes successfully
 *
 * User: "Add phone number to user profile"
 *
 * Regeneration:
 * - INTERFACE phase starts regeneration
 * - Calls getPreviousInterfaceSchemas(["IUser", "IUser.IUpdate"])
 *   → Loads the previous versions of these schemas
 * - Creates new versions with phoneNumber property added
 * ```
 *
 * **Automatic Dependency Loading:**
 *
 * When schemas are loaded from the previous version, their referenced
 * schemas (via `$ref`) are also available, providing complete type dependency
 * context for understanding the schema structure.
 *
 * **Schema Type Naming Convention:**
 *
 * - Entity schemas: `IEntityName` (e.g., "IUser", "IPost", "IShoppingSale")
 * - Nested DTOs: `IEntityName.ISubType` (e.g., "IUser.ICreate", "IPost.IUpdate")
 * - Response wrappers: `IPage<IEntityName>` (e.g., "IPageIUser", "IPageIPost")
 * - Summary types: `IEntityName.ISummary` (e.g., "IBbsArticle.ISummary")
 * - Authorized types: `IEntityName.IAuthorized` (e.g., "IUser.IAuthorized")
 *
 * **Waterfall + Spiral Pattern:**
 *
 * This aligns with AutoBE's regeneration cycles where:
 * - Compilation failures trigger regeneration with corrections
 * - User modifications trigger new versions
 * - Previous schemas serve as reference for incremental DTO changes
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryGetPreviousInterfaceSchemas {
  /**
   * Type discriminator for the request.
   *
   * Determines which action to perform: preliminary data retrieval or actual
   * task execution. Value "getPreviousInterfaceSchemas" indicates this is a
   * preliminary data request for interface schemas from a previous version.
   */
  type: "getPreviousInterfaceSchemas";

  /**
   * List of schema type names to retrieve from the previous version.
   *
   * These are type names from the OpenAPI components.schemas section that were
   * generated in a previous version and are needed as reference context for
   * the current regeneration.
   *
   * **Important Notes:**
   *
   * - These type names MUST exist in the previous version
   * - This function is only available when a previous version exists
   * - Used for reference/comparison, not for re-requesting within same execution
   * - Type names follow TypeScript interface naming (e.g., "IUser", "IUser.ICreate")
   *
   * **When This Function is Available:**
   *
   * - When a previous version exists
   * - When user requests modifications to existing API schemas
   * - During correction/regeneration cycles that need previous schema context
   *
   * **When This Function is NOT Available:**
   *
   * - During initial generation (no previous version exists)
   * - No previous interface schemas available for this orchestration task
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
