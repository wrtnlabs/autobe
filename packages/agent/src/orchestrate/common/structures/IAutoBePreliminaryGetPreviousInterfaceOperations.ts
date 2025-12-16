import { AutoBeOpenApi } from "@autobe/interface";
import { tags } from "typia";

/**
 * Request to retrieve interface operations from a previous version.
 *
 * This type is used to load API operation definitions that were generated in a
 * **previous version** of the AutoBE generation pipeline. This is NOT about
 * re-requesting operations within the same execution, but rather accessing
 * artifacts from an earlier version.
 *
 * **Use Case:** When regenerating or modifying API operations based on user
 * change requests, agents need to reference the previously generated operations
 * to understand the existing API design and what needs to be modified.
 *
 * **Key Difference from `getInterfaceOperations`:**
 *
 * - `getInterfaceOperations`: Fetches operations from the **current version**
 *   (the version being generated right now)
 * - `getPreviousInterfaceOperations`: Fetches operations from the **previous
 *   version** (the last successfully generated version)
 *
 * **Example Scenario:**
 *
 * ```
 * Initial generation:
 * - INTERFACE phase creates: GET /users, POST /users, GET /users/{id}
 * - Generation completes successfully
 *
 * User: "Change user creation to require email verification"
 *
 * Regeneration:
 * - INTERFACE phase starts regeneration
 * - Calls getPreviousInterfaceOperations([{method: "POST", path: "/users"}])
 *   → Loads the previous version of POST /users operation
 * - Creates new version with emailVerification requirement in request body
 * ```
 *
 * **Automatic Schema Loading:**
 *
 * When operations are loaded from the previous version, their associated
 * request/response body schemas are also referenced, providing complete context
 * for understanding the operation's data structures.
 *
 * **Waterfall + Spiral Pattern:**
 *
 * This aligns with AutoBE's regeneration cycles where:
 * - Compilation failures trigger regeneration with corrections
 * - User modifications trigger new versions
 * - Previous operations serve as reference for incremental API changes
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryGetPreviousInterfaceOperations {
  /**
   * Type discriminator for the request.
   *
   * Determines which action to perform: preliminary data retrieval or actual
   * task execution. Value "getPreviousInterfaceOperations" indicates this is a
   * preliminary data request for interface operations from a previous version.
   */
  type: "getPreviousInterfaceOperations";

  /**
   * List of API operation endpoints to retrieve from the previous version.
   *
   * These are endpoint identifiers (method + path) that were generated in a
   * previous version and are needed as reference context for the current
   * regeneration.
   *
   * **Important Notes:**
   *
   * - These endpoints MUST exist in the previous version
   * - This function is only available when a previous version exists
   * - Used for reference/comparison, not for re-requesting within same execution
   * - Each endpoint is identified by: `{method: "GET|POST|PUT|DELETE|PATCH",
   *   path: "/api/path"}`
   *
   * **When This Function is Available:**
   *
   * - When a previous version exists
   * - When user requests modifications to existing API operations
   * - During correction/regeneration cycles that need previous operation context
   *
   * **When This Function is NOT Available:**
   *
   * - During initial generation (no previous version exists)
   * - No previous interface operations available for this orchestration task
   *
   * **Endpoint Format:**
   *
   * - Method: HTTP verb in uppercase (e.g., "GET", "POST", "PUT", "DELETE", "PATCH")
   * - Path: OpenAPI path with parameters (e.g., "/users/{id}", "/posts")
   *
   * **Example Endpoints:**
   *
   * - `{method: "GET", path: "/users/{id}"}`
   * - `{method: "POST", path: "/shoppings/orders"}`
   * - `{method: "PATCH", path: "/bbs/articles"}`
   */
  endpoints: AutoBeOpenApi.IEndpoint[] & tags.MinItems<1>;
}
