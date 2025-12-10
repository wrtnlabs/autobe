import { AutoBeOpenApi } from "@autobe/interface";
import { tags } from "typia";

/**
 * Request to re-retrieve previously requested interface operations for context.
 *
 * This type is used in the preliminary phase to re-request API operation
 * definitions that were already fetched in previous iterations within the same
 * orchestration task. Unlike `IAutoBePreliminaryGetInterfaceOperations` which
 * retrieves NEW operations from the global state, this retrieves operations
 * from the LOCAL context that were previously requested.
 *
 * **Use Case:** When an agent needs to access API operations across multiple
 * RAG iterations, it may need to re-request operations from earlier iterations
 * to maintain interface context. This is particularly useful in:
 *
 * - Interface complement cycles that reference existing operations
 * - Realize operation generation that needs prerequisite operation context
 * - Test generation that validates against previously generated operations
 * - Correction cycles that need to verify consistency with other endpoints
 *
 * **Key Difference from Regular `getInterfaceOperations`:**
 *
 * - Regular: Fetches NEW operations from global state (not yet in local context)
 * - GetPrevious: Re-fetches operations ALREADY in local context from prior
 *   requests
 *
 * **Example Scenario:**
 *
 * 1. First iteration: Agent requests `[{method: "GET", path: "/users"}]` via
 *    `getInterfaceOperations`
 * 2. Agent also gets prerequisite operations automatically via complement
 * 3. Second iteration: Agent needs GET /users again → use
 *    `getPreviousInterfaceOperations`
 * 4. This avoids duplicate request errors and maintains operation context
 *    efficiently
 *
 * **Automatic Schema Loading:** When operations are re-requested, their
 * associated request/response body schemas are automatically loaded from the
 * local context as well, maintaining complete type information for the
 * operation.
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryGetPreviousInterfaceOperations {
  /**
   * Type discriminator for the request.
   *
   * Determines which action to perform: preliminary data retrieval or actual
   * task execution. Value "getPreviousInterfaceOperations" indicates this is a
   * preliminary data request for previously requested interface operations.
   */
  type: "getPreviousInterfaceOperations";

  /**
   * List of API operation endpoints to re-retrieve from previous requests.
   *
   * Endpoint identifiers (method + path) that were already requested in
   * previous iterations within this orchestration task. These endpoints should
   * exist in the local context.
   *
   * **Important Notes:**
   *
   * - These endpoints MUST have been requested in a previous iteration
   * - Requesting non-existent or never-before-requested endpoints will fail
   * - Use this to maintain interface context across multiple RAG cycles
   * - Prefer this over `getInterfaceOperations` when you need to re-access known
   *   operations
   * - Each endpoint is identified by: `{method: "GET|POST|PUT|DELETE|PATCH",
   *   path: "/api/path"}`
   *
   * **Endpoint Format:**
   *
   * - Method: HTTP verb in uppercase (e.g., "GET", "POST", "PUT", "DELETE",
   *   "PATCH")
   * - Path: OpenAPI path with parameters (e.g., "/users/{id}", "/posts")
   */
  endpoints: AutoBeOpenApi.IEndpoint[] & tags.MinItems<1>;
}
