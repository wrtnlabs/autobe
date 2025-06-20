import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Realize agent begins the implementation process for
 * business logic and service layer code.
 *
 * This event marks the initiation of the final phase in the vibe coding
 * pipeline, where the complete architectural foundation is transformed into
 * working application code. The Realize agent start represents the critical
 * transition from design specifications to executable implementation, bringing
 * together requirements analysis, database schemas, API contracts, and test
 * scenarios.
 *
 * The implementation process that begins with this event will systematically
 * create service methods, business logic, data access patterns, and integration
 * code that transforms the designed system into a fully functional application
 * ready for deployment and real-world operation.
 *
 * @author Samchon
 */
export interface AutoBeRealizeStartEvent
  extends AutoBeEventBase<"realizeStart"> {
  /**
   * Reason why the Realize agent was activated through function calling.
   *
   * Explains the specific circumstances that triggered the AI chatbot to invoke
   * the Realize agent via function calling. This could include reasons such as
   * initial implementation generation after API and test completion, updating
   * business logic due to requirement changes, regenerating implementation to
   * reflect modified API specifications or database schemas, or creating
   * additional service functionality.
   *
   * Understanding the activation reason provides context for the implementation
   * scope and helps stakeholders understand whether this represents initial
   * development, refinement of existing implementation, or expansion of
   * application functionality.
   */
  reason: string;

  /**
   * Iteration number of the requirements analysis this implementation is being
   * started for.
   *
   * Indicates which version of the requirements analysis this implementation
   * will reflect. This step number ensures that the Realize agent works with
   * the current requirements and helps track the evolution of implementation
   * code as business requirements, database schemas, and API specifications
   * change.
   *
   * The step value enables proper synchronization between implementation
   * activities and the underlying requirements, ensuring that the generated
   * code remains aligned with the current project scope and business objectives
   * throughout the final development phase.
   */
  step: number;
}
