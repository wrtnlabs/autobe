import { AutoBeOpenApi } from "../../openapi";
import { AutoBeTestFunctionBase } from "./AutoBeTestFunctionBase";

/**
 * Authorization function for E2E test code.
 *
 * @author Michael
 */
export interface AutoBeTestAuthorizeFunction extends AutoBeTestFunctionBase<"authorize"> {
  /** Source API endpoint this authorization function was generated from. */
  endpoint: AutoBeOpenApi.IEndpoint;

  /** Actor name (e.g., "admin", "user"). */
  actor: string;

  /**
   * Authentication type, matching
   * {@link AutoBeOpenApi.IOperation.authorizationType}:
   *
   * - "login": Authenticate existing user
   * - "join": Register new user
   * - "refresh": Renew expired token
   */
  authType: string;
}
