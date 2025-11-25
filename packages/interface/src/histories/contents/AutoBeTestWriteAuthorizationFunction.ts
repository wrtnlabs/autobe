import { AutoBeOpenApi } from "../../openapi";
import { AutoBeTestWriteFunctionBase } from "./AutoBeTestWriteFunctionBase";

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
export interface AutoBeTestWriteAuthorizationFunction
  extends AutoBeTestWriteFunctionBase<"authorization"> {
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
}
