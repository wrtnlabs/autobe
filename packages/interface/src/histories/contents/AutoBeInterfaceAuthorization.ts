import { AutoBeOpenApi } from "../../openapi";

/**
 * Interface representing JWT-based authentication and authorization API
 * operations generated for a specific user role.
 *
 * This interface contains essential authentication operations (join, login,
 * validate, changePassword, refresh) plus additional operations that are
 * supported by the Prisma schema structure, such as email verification and
 * password reset flows.
 *
 * The operations are generated based on available schema fields and provide a
 * complete authentication system for the specified role.
 *
 * @author Michael
 */
export interface AutoBeInterfaceAuthorization {
  /**
   * The user role for which authentication operations are generated.
   *
   * This identifies the specific role (e.g. user, admin, seller) that will have
   * these JWT-based authentication operations. Used to create role-specific
   * authentication endpoints and flows.
   */
  role: string;

  /**
   * Array of JWT authentication and authorization API operations for this role.
   *
   * Contains essential authentication operations plus schema-driven additional
   * operations like email verification and password reset. Each operation
   * includes proper JWT token management and security implementations.
   */
  operations: AutoBeOpenApi.IOperation[];
}
