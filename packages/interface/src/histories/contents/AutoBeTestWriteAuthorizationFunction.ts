import { AutoBeOpenApi } from "../../openapi";

/**
 * Interface defining authorization functions used in test code.
 *
 * Defines functions that perform authentication processes such as login,
 * signup, and token refresh for each actor (user role) during E2E test
 * execution. This interface is used by AutoBE to represent the structure and
 * content of authorization functions when generating test code.
 *
 * @author Michael
 */
export interface AutoBeTestWriteAuthorizationFunction {
  /**
   * Type discriminator indicating that this object is an authorization
   * function. Used to distinguish types in the discriminated union pattern.
   */
  kind: "authorization";

  /**
   * OpenAPI endpoint specification that this authorization function corresponds
   * to.
   *
   * Used to determine which endpoint this authorization function was generated
   * from. For example, a login authorization function is generated from POST
   * /auth/login endpoint.
   */
  endpoint: AutoBeOpenApi.IEndpoint;

  /**
   * Actor name representing the user role performing authentication.
   *
   * Examples: "admin", "user", "guest", etc. Each actor has different
   * permissions and access scopes, requiring separate authorization functions.
   */
  actor: string;

  /**
   * Authentication type - one of "login" | "join" | "refresh".
   *
   * - Login: Authenticate existing user
   * - Join: Register new user
   * - Refresh: Renew expired token
   */
  authType: string;

  /**
   * File system path where the authorization function should be located.
   *
   * Specifies the relative or absolute path for the authorization function
   * within the project structure. This location typically follows authorization
   * conventions and may be organized by API endpoints, feature modules, or
   * business domains to ensure logical authorization suite organization and
   * easy navigation.
   *
   * Example: "test/features/common/authorize/authorize_user_login.ts"
   */
  location: string;

  /**
   * Function name of the authorization function.
   *
   * The TypeScript function name in snake_case format combining the action and
   * actor information.
   *
   * Example: "authorize_user_login", "authorize_admin_join",
   * "authorize_guest_refresh"
   */
  functionName: string;

  /**
   * Complete TypeScript source code content of the authorization function.
   *
   * Contains the full implementation of the authorization function including
   * imports, helper functions, and the actual authorization logic. The content
   * is structured as executable TypeScript code that implements the
   * authorization workflow for the specified endpoint and actor.
   *
   * Each authorization function typically includes:
   *
   * - Authentication logic for the specified actor
   * - Token validation and renewal logic
   * - Error handling and logging
   * - Integration with authentication services or database schemas
   *
   * The content ensures that the authorization function is complete, secure,
   * and properly integrates with the overall application architecture while
   * adhering to best practices for authentication and access control.
   *
   * The authorization function serves as a critical component in the test
   * suite, ensuring that tests can authenticate users, validate tokens, and
   * enforce proper access controls while maintaining the integrity of the test
   * environment.
   */
  content: string;
}
