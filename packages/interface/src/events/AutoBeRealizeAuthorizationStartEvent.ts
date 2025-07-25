import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the authorization implementation phase begins.
 *
 * This event marks the start of generating authorization-related code for the
 * application's security infrastructure. The Realize agent begins creating
 * decorators, payloads, and providers for each user role defined in the
 * requirements, establishing the foundation for role-based access control
 * throughout the generated application.
 *
 * @author Michael
 */
export interface AutoBeRealizeAuthorizationStartEvent
  extends AutoBeEventBase<"realizeAuthorizationStart"> {
  /**
   * Iteration number of the requirements analysis being implemented.
   *
   * Indicates which version of the requirements analysis this authorization
   * implementation is based on. This helps track the alignment between
   * security implementation and business requirements across iterations.
   */
  step: number;
}
