import { AutoBeRealizeAuthorization } from "../histories/contents/AutoBeRealizeAuthorization";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

/**
 * Event fired when the Realize Authorization agent writes authorization-related
 * implementation files.
 *
 * This event represents the generation of authorization components including
 * decorators, providers, and payload interfaces that enable role-based access
 * control throughout the application. The event occurs during the authorization
 * implementation phase where security policies defined in the API specification
 * are transformed into working authorization code.
 *
 * The generated authorization files include custom decorators for endpoint
 * protection, payload interfaces for JWT token structure, and provider
 * functions that handle authorization logic validation and enforcement.
 *
 * @author Michael
 */
export interface AutoBeRealizeAuthorizationWriteEvent
  extends AutoBeEventBase<"realizeAuthorizationWrite">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
  /**
   * Authorization implementation details being written.
   *
   * Contains the complete authorization component specification including the
   * role name, decorator implementation, payload interface, and provider
   * function. This object represents a single authorization component that will
   * be generated for a specific user role in the system.
   */
  authorization: AutoBeRealizeAuthorization;

  /**
   * Iteration number of the requirements analysis this authorization
   * implementation reflects.
   *
   * Indicates which version of the requirements analysis this authorization
   * work is based on. This step number ensures that the authorization
   * implementation is aligned with the current requirements and helps track the
   * development of access control components as they evolve with changing
   * business needs.
   *
   * The step value enables proper synchronization between authorization
   * implementation and the underlying requirements, ensuring that the generated
   * authentication and authorization code remains relevant to the current
   * project scope and security requirements.
   */
  step: number;
}
