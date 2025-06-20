import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Interface agent begins the RESTful API design process.
 *
 * This event marks the initiation of the sophisticated multi-stage
 * transformation pipeline that converts validated AST structures into
 * comprehensive API specifications. The Interface agent start represents a
 * critical transition point where database schemas and requirements analysis
 * are transformed into API contracts that bridge data storage and application
 * functionality.
 *
 * The API design process that begins with this event will proceed through
 * endpoint creation, operation definition, component specification, and final
 * code generation to produce production-ready NestJS applications with complete
 * type safety and business logic integration.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceStartEvent
  extends AutoBeEventBase<"interfaceStart"> {
  /**
   * Reason why the Interface agent was activated through function calling.
   *
   * Explains the specific circumstances that triggered the AI chatbot to invoke
   * the Interface agent via function calling. This could include reasons such
   * as completing initial API design after database schema creation, updating
   * API specifications due to requirement changes, regenerating interfaces to
   * reflect modified data models, or creating new API endpoints for additional
   * functionality.
   *
   * Understanding the activation reason provides context for the API design
   * scope and helps stakeholders understand whether this represents new
   * development, refinement of existing specifications, or integration with
   * updated database schemas.
   */
  reason: string;

  /**
   * Iteration number of the requirements analysis this API design is being
   * started for.
   *
   * Indicates which version of the requirements analysis this API design will
   * reflect. This step number ensures that the Interface agent works with the
   * current requirements and helps track the evolution of API specifications as
   * requirements and database schemas change.
   *
   * The step value enables proper synchronization between API design activities
   * and the underlying requirements, ensuring that the API development remains
   * aligned with the current project scope and business objectives throughout
   * the iterative development process.
   */
  step: number;
}
