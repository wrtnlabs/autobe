import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Interface agent defines schema components during the API
 * specification process.
 *
 * This event occurs when the Interface agent is creating the reusable schema
 * definitions that will be used throughout the API specification. Components
 * include data transfer objects (DTOs), request/response schemas, and other
 * type definitions that provide the structural foundation for API operations
 * and ensure type safety across the entire application.
 *
 * The component creation process ensures that all data structures used in API
 * operations are properly defined, validated, and documented, enabling
 * consistent data handling and robust type checking throughout the generated
 * application.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceComponentsEvent
  extends AutoBeEventBase<"interfaceComponents"> {
  /**
   * Schema components being defined for the API specification.
   *
   * Contains the {@link AutoBeOpenApi.IComponents} structure that defines
   * reusable schemas, parameters, responses, and other OpenAPI components.
   * These components serve as the building blocks for API operations, providing
   * consistent type definitions and ensuring that data structures are properly
   * validated and documented.
   *
   * The components maintain perfect alignment with the database schema while
   * providing the appropriate level of abstraction for API consumers, including
   * proper validation rules, descriptive documentation, and type safety
   * throughout the application stack.
   */
  components: AutoBeOpenApi.IComponents;

  /**
   * Number of schema components that have been completed so far.
   *
   * Indicates the current progress in the component definition process, showing
   * how many schema components have been successfully created and validated.
   * This progress tracking helps stakeholders understand the advancement of the
   * API specification development and estimate completion timing.
   */
  completed: number;

  /**
   * Total number of schema components that need to be defined.
   *
   * Represents the complete scope of component definitions required for the API
   * specification. This total count provides context for the completion
   * progress and helps stakeholders understand the overall complexity and scope
   * of the API being designed.
   */
  total: number;

  /**
   * Iteration number of the requirements analysis this component creation was
   * performed for.
   *
   * Indicates which version of the requirements analysis this component design
   * reflects. This step number ensures that the schema components are aligned
   * with the current requirements and helps track the evolution of data
   * structures as requirements change.
   *
   * The step value enables proper synchronization between component definitions
   * and the underlying requirements, ensuring that the API schemas remain
   * relevant to the current project scope and business objectives.
   */
  step: number;
}
