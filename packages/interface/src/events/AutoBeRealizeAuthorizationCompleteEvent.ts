import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the authorization implementation phase is completed.
 *
 * This event occurs when the Realize agent has successfully generated all
 * authorization-related components including decorators, payloads, and
 * providers for all user roles defined in the system. The completion of
 * authorization implementation marks a critical milestone in establishing the
 * security infrastructure of the generated application.
 *
 * @author Michael
 */
export interface AutoBeRealizeAuthorizationCompleteEvent
  extends AutoBeEventBase<"realizeAuthorizationComplete"> {
  /**
   * Iteration number of the requirements analysis this authorization
   * implementation is based on.
   *
   * Indicates the version of requirements that guided this authorization
   * implementation. This tracking ensures proper synchronization between the
   * generated security components and the current business requirements.
   */
  step: number;
}
