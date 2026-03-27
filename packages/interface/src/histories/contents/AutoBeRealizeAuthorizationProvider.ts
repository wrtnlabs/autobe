import { CamelCasePattern } from "../../typings/CamelCasePattern";

/**
 * Authorization provider function for JWT verification and role validation.
 *
 * @author Michael
 */
export interface AutoBeRealizeAuthorizationProvider {
  /**
   * Provider function name in camelCase (e.g., "adminAuthorize",
   * "userAuthorize").
   */
  name: string & CamelCasePattern;

  /** File path for the generated provider. */
  location: string;

  /** Complete TypeScript source code of the provider function. */
  content: string;
}
