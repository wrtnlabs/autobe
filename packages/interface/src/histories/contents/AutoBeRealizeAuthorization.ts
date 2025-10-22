import { AutoBeAnalyzeActor } from "./AutoBeAnalyzeActor";
import { AutoBeRealizeAuthorizationDecorator } from "./AutoBeRealizeAuthorizationDecorator";
import { AutoBeRealizeAuthorizationPayload } from "./AutoBeRealizeAuthorizationPayload";
import { AutoBeRealizeAuthorizationProvider } from "./AutoBeRealizeAuthorizationProvider";

/**
 * Authorization implementation for a specific user actor.
 *
 * This interface represents a complete authorization configuration for a single
 * user actor within the application. It encapsulates all the necessary
 * components required to implement actor-based access control (ABAC) in a NestJS
 * application, including decorators for route protection, payload structures
 * for JWT tokens, and providers for authorization logic.
 *
 * Each actor defined in the requirements analysis will have its own
 * authorization implementation, ensuring proper separation of concerns and
 * granular access control throughout the generated application.
 *
 * @author Michael
 */
export interface AutoBeRealizeAuthorization {
  /**
   * The user actor configuration from requirements analysis.
   *
   * This object contains the complete actor definition including the actor name,
   * permissions, and authentication requirements as analyzed from the project
   * requirements. The actor configuration is used throughout the authorization
   * infrastructure to determine access permissions, apply appropriate guards,
   * and validate user actions.
   */
  actor: AutoBeAnalyzeActor;

  /**
   * Decorator implementation for actor-based authorization.
   *
   * Contains the custom decorator code that can be applied to controllers and
   * routes to enforce access control for this specific actor. This decorator
   * integrates with NestJS guards to protect endpoints based on the user's actor
   * and permissions.
   */
  decorator: AutoBeRealizeAuthorizationDecorator;

  /**
   * Payload structure for authentication tokens.
   *
   * Defines the data structure carried in JWT tokens or session data for users
   * with this actor. This payload contains essential information for
   * authentication and authorization decisions, such as user ID, actor,
   * permissions, and any custom claims specific to this actor.
   */
  payload: AutoBeRealizeAuthorizationPayload;

  /**
   * Provider implementation for authorization logic.
   *
   * Contains the core authorization logic implementation, including guards,
   * strategies, and services that validate user permissions and enforce access
   * control policies. This provider handles the runtime validation of user
   * actions based on their assigned actor.
   */
  provider: AutoBeRealizeAuthorizationProvider;
}
