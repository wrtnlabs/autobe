import { tags } from "typia";

import { AutoBeOpenApi } from "../../openapi";
import { CamelCasePattern } from "../../typings/CamelCasePattern";

/**
 * Endpoint design with description, authorization, and endpoint definition.
 *
 * @author Michael
 * @author Samchon
 */
export interface AutoBeInterfaceEndpointDesign {
  /** Functional description of what this endpoint does and why. Keep concise. */
  description: string;

  /**
   * Authorization actors associated with this endpoint (camelCase).
   *
   * Include an actor if it can call this endpoint or the endpoint is
   * semantically related to it (e.g., `/auth/users/login` → `["user"]`). Empty
   * array for public endpoints.
   *
   * Each actor may generate a separate endpoint — minimize to prevent endpoint
   * explosion.
   */
  authorizationActors: Array<string & CamelCasePattern & tags.MinLength<1>>;

  /**
   * Authorization type of the endpoint.
   *
   * - `"login"`: Credential validation
   * - `"join"`: Account registration
   * - `"withdraw"`: Account deactivation
   * - `"refresh"`: Token renewal
   * - `"session"`: Session management (logout, etc.)
   * - `"password"`: Password reset/change
   * - `"management"`: Other auth-related (2FA, OAuth, verification)
   * - `null`: All other endpoints
   */
  authorizationType:
    | "login"
    | "join"
    | "withdraw"
    | "refresh"
    | "session"
    | "password"
    | "management"
    | null;

  /** The endpoint definition containing path and HTTP method. */
  endpoint: AutoBeOpenApi.IEndpoint;
}
