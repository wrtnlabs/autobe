import { ITraceable } from "./AutoBeAnalyzeDocumentTraceable";

/**
 * Extension category: Workflow & State Machine.
 *
 * Structures state transitions/workflows as **direct input** for business logic
 * implementation in the Realize Phase.
 *
 * Optional category: selected for projects with complex state transition
 * business logic.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeDocumentWorkflow {
  /** Workflow/state machine list */
  workflows: Array<
    {
      /** Workflow name (e.g., "Order Processing", "User Account Lifecycle") */
      name: string;
      /** Workflow description */
      description: string;
      /** State list */
      states: Array<{
        /** State name (e.g., "pending", "active", "banned") */
        name: string;
        /** State description */
        description: string;
        /** Transitions from this state */
        transitions: Array<{
          /** Target state */
          to: string;
          /** Trigger that causes the transition */
          trigger: string;
          /** Transition guard condition */
          guard?: string;
        }>;
      }>;
    } & ITraceable
  >;
}
