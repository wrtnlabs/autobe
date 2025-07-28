import { AutoBeRealizeAuthorizationDecorator } from "./AutoBeRealizeAuthorizationDecorator";
import { AutoBeRealizeAuthorizationPayload } from "./AutoBeRealizeAuthorizationPayload";
import { AutoBeRealizeAuthorizationProvider } from "./AutoBeRealizeAuthorizationProvider";

/**
 * Authorization implementation for a specific user role.
 *
 * This interface represents a complete authorization configuration for a single
 * user role within the application. It encapsulates all the necessary
 * components required to implement role-based access control (RBAC) in a NestJS
 * application, including decorators for route protection, payload structures
 * for JWT tokens, and providers for authorization logic.
 *
 * Each role defined in the requirements analysis will have its own
 * authorization implementation, ensuring proper separation of concerns and
 * granular access control throughout the generated application.
 *
 * @author Michael
 */
export interface AutoBeRealizeAuthorization {
  /**
   * The user role identifier (e.g., 'admin', 'user', 'guest').
   *
   * This string uniquely identifies a user role within the system. The role
   * name is used throughout the authorization infrastructure to determine
   * access permissions, apply appropriate guards, and validate user actions. It
   * should match the roles defined in the requirements analysis.
   */
  role: string;

  /**
   * Decorator implementation for role-based authorization.
   *
   * Contains the custom decorator code that can be applied to controllers and
   * routes to enforce access control for this specific role. This decorator
   * integrates with NestJS guards to protect endpoints based on the user's role
   * and permissions.
   */
  decorator: AutoBeRealizeAuthorizationDecorator;

  /**
   * Payload structure for authentication tokens.
   *
   * Defines the data structure carried in JWT tokens or session data for users
   * with this role. This payload contains essential information for
   * authentication and authorization decisions, such as user ID, role,
   * permissions, and any custom claims specific to this role.
   */
  payload: AutoBeRealizeAuthorizationPayload;

  /**
   * Provider implementation for authorization logic.
   *
   * Contains the core authorization logic implementation, including guards,
   * strategies, and services that validate user permissions and enforce access
   * control policies. This provider handles the runtime validation of user
   * actions based on their assigned role.
   */
  provider: AutoBeRealizeAuthorizationProvider;
}
