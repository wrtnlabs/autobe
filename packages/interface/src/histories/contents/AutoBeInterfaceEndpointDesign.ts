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
   *
   * Write concisely. Keep it brief and to the point.
   */
  description: string;

  /**
   * Authorization actors associated with this API endpoint.
   *
   * Specify actors that are **associated with** this endpoint. An actor should
   * be included if:
   *
   * 1. **The actor can call this endpoint**: The endpoint requires authentication
   *    and only this actor type can access it.
   * 2. **The endpoint is related to the actor**: If the endpoint path contains the
   *    actor name (e.g., `/auth/users/login` → `"user"`), or the endpoint
   *    serves that actor type, include the actor to indicate the relationship.
   *
   * ## Examples
   *
   * - `/auth/users/login` → `["user"]` (related to user)
   * - `/auth/admins/join` → `["admin"]` (related to admin)
   * - `/users/{userId}/profile` → `["user"]` (user can call)
   * - `/products` → `[]` (public, no association)
   *
   * ## ⚠️ Actor Multiplication Effect
   *
   * Each actor may generate a separate endpoint. Minimize actors to prevent
   * endpoint explosion.
   *
   * ## Naming Convention
   *
   * Use camelCase for all actor names (e.g., `"user"`, `"admin"`, `"seller"`).
   */
  authorizationActors: Array<string & CamelCasePattern & tags.MinLength<1>>;

  /**
   * Authorization type of the API endpoint.
   *
   * - `"login"`: User login endpoint that validate credentials
   * - `"join"`: User registration endpoint that create accounts
   * - `"refresh"`: Token refresh endpoint that renew access tokens
   * - `"session"`: Session related endpoint
   * - `"password"`: Password related endpoint
   * - `"management"`: Authentication-related endpoint other than login, join, and
   *   refresh (e.g., logout, email/phone verification, 2FA, OAuth, profile)
   * - `null`: All other endpoint (CRUD, business logic, etc.)
   */
  authorizationType:
    | "login"
    | "join"
    | "refresh"
    | "session"
    | "password"
    | "management"
    | null;

  /** The endpoint definition containing path and HTTP method. */
  endpoint: AutoBeOpenApi.IEndpoint;
}
