import { tags } from "typia";

import { AutoBeOpenApi } from "../../openapi";
import { CamelCasePattern } from "../../typings/CamelCasePattern";

/**
 * Endpoint design with description and specification.
 *
 * Represents a single endpoint generated during the write phase, pairing the
 * endpoint definition (path + method) with a description of its purpose.
 *
 * This type formalizes the legacy
 * `IAutoBeInterfaceEndpointWriteApplication.IContent` structure for reuse
 * across the codebase. The description provides business context that helps:
 *
 * - Review agents validate that the endpoint fulfills actual requirements
 * - Operation generation create appropriate request/response schemas
 * - Schema design infer correct data structures
 *
 * @author Michael
 * @author Samchon
 */
export interface AutoBeInterfaceEndpointDesign {
  /**
   * Description of what this endpoint does.
   *
   * Functional description of the endpoint's purpose and business context.
   * Should explain the use case and requirements this endpoint fulfills, not
   * just repeat the path/method.
   */
  description: string;

  /**
   * Authorization actors required to access this API operation.
   *
   * This field specifies which user actors are allowed to access this endpoint.
   * Multiple actors can be specified to allow different types of users to
   * access the same endpoint.
   *
   * ## ⚠️ CRITICAL: Actor Multiplication Effect
   *
   * **EACH ACTOR IN THIS ARRAY GENERATES A SEPARATE ENDPOINT**
   *
   * - If you specify `["admin", "moderator", "member"]`, this creates 3 separate
   *   endpoints
   * - Total generated endpoints = operations × average actors.length
   * - Example: 100 operations with 3 actors each = 300 actual endpoints
   *
   * ## 🔴 AVOID OVER-GENERATION
   *
   * **DO NOT create actor-specific endpoints when a public endpoint would
   * suffice:**
   *
   * - ❌ BAD: Separate GET endpoints for admin, member, moderator to view the same
   *   public data
   * - ✅ GOOD: Single public endpoint `[]` with actor-based filtering in business
   *   logic
   *
   * **DO NOT enumerate all possible actors when the database schema uses a
   * single User table:**
   *
   * - If database has a User table with role/permission fields, you likely only
   *   need `["user"]`
   * - Avoid listing `["admin", "seller", "buyer", "moderator", ...]`
   *   unnecessarily
   * - The actual actor checking happens in business logic, not at the endpoint
   *   level
   *
   * ## Naming Convention
   *
   * DO: Use camelCase for all actor names.
   *
   * ## Important Guidelines
   *
   * - Set to empty array `[]` for public endpoints that require no authentication
   * - Set to array with actor strings for actor-restricted endpoints
   * - **MINIMIZE the number of actors per endpoint to prevent explosion**
   * - Consider if the endpoint can be public with actor-based filtering instead
   * - The actor names match exactly with the user type/actor defined in the
   *   database
   * - This will be used by the Realize Agent to generate appropriate decorator
   *   and authorization logic in the provider functions
   * - The controller will apply the corresponding authentication decorator based
   *   on these actors
   *
   * ## Examples
   *
   * - `[]` - Public endpoint, no authentication required (PREFERRED for read
   *   operations)
   * - `["user"]` - Any authenticated user can access (PREFERRED for user-specific
   *   operations)
   * - `["admin"]` - Only admin users can access (USE SPARINGLY)
   * - `["admin", "moderator"]` - Both admin and moderator users can access (AVOID
   *   if possible)
   * - `["seller"]` - Only seller users can access (ONLY if Seller is a separate
   *   table)
   *
   * ## Best Practices
   *
   * 1. **Start with public `[]` for all read operations** unless sensitive data is
   *    involved
   * 2. **Use single actor `["user"]` for authenticated operations** and handle
   *    permissions in business logic
   * 3. **Only use multiple actors when absolutely necessary** for different
   *    business logic paths
   * 4. **Remember: Fewer actors = Fewer endpoints = Better performance and
   *    maintainability**
   *
   * Note: The actual authentication/authorization implementation will be
   * handled by decorators at the controller level, and the provider function
   * will receive the authenticated user object with the appropriate type.
   */
  authorizationActors: Array<string & CamelCasePattern & tags.MinLength<1>>;

  /**
   * Authorization type of the API endpoint.
   *
   * - `"login"`: User login endpoint that validate credentials
   * - `"join"`: User registration endpoint that create accounts
   * - `"refresh"`: Token refresh endpoint that renew access tokens
   * - `"session"`: Session management endpoint that manage user sessions
   * - `"management"`: Authentication-related endpoint other than login, join, and
   *   refresh (e.g., logout, password reset/change, email/phone verification,
   *   2FA, OAuth, session management, profile)
   * - `"password"`: Password management endpoint that manage user passwords
   * - `null`: All other endpoint (CRUD, business logic, etc.)
   */
  authorizationType:
    | "login"
    | "join"
    | "refresh"
    | "session"
    | "management"
    | "password"
    | null;

  /** The endpoint definition containing path and HTTP method. */
  endpoint: AutoBeOpenApi.IEndpoint;
}
