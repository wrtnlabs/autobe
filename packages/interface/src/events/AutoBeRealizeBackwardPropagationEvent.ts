import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when the Realize agent triggers backward propagation to
 * redesign DTO schemas in the Interface phase.
 *
 * When the realize agent discovers that DTO schemas are inadequately designed
 * for proper API implementation, it triggers backward propagation to have the
 * interface schema refine process redesign the affected schemas. This event
 * captures that occurrence for monitoring and debugging purposes.
 *
 * After this event is dispatched, the standard `interfaceSchemaRefine` events
 * will follow as the schemas are actually refined. This event serves as the
 * trigger notification.
 *
 * @author Samchon
 */
export interface AutoBeRealizeBackwardPropagationEvent
  extends AutoBeEventBase<"realizeBackwardPropagation"> {
  /**
   * DTO type names that are being redesigned.
   *
   * These are schema names from `components.schemas` that were identified
   * as problematic for implementation by the realize agent.
   */
  typeNames: string[];

  /**
   * Detailed reason why these schemas need redesign.
   *
   * Explains what implementation issues the current schema design causes,
   * as reported by the realize agent.
   */
  reason: string;

  /**
   * Iteration number of the requirements analysis.
   */
  step: number;
}
