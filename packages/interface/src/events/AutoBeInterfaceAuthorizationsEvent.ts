import { AutoBeOpenApi } from "../openapi";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeInterfaceAuthorizationsEvent
  extends AutoBeEventBase<"interfaceAuthorizations"> {
  /**
   * Array of API operations being defined for the endpoints.
   *
   * Contains the detailed {@link AutoBeOpenApi.IOperation} specifications that
   * define the business logic, parameters, responses, and behavior for each API
   * function. Each operation includes comprehensive documentation,
   * request/response schemas, error handling specifications, and security
   * requirements that transform basic endpoints into complete API contracts.
   *
   * The operations ensure that every API function has clear behavioral
   * definitions, proper validation rules, and comprehensive documentation that
   * enables accurate implementation and reliable client integration throughout
   * the application ecosystem.
   */
  operations: AutoBeOpenApi.IOperation[];

  /**
   * Number of API operations that have been completed so far.
   *
   * Indicates the current progress in the operation definition process, showing
   * how many API operations have been successfully designed and documented.
   * This progress tracking helps stakeholders monitor the advancement of the
   * API specification development and understand completion timing.
   */
  completed: number;

  /**
   * Total number of API operations that need to be defined.
   *
   * Represents the complete scope of operation definitions required for the API
   * specification. This total count provides context for the completion
   * progress and helps stakeholders understand the overall complexity and
   * functional scope of the API being designed.
   */
  total: number;

  /**
   * Iteration number of the requirements analysis this operation definition was
   * performed for.
   *
   * Indicates which version of the requirements analysis this operation design
   * reflects. This step number ensures that the API operations are aligned with
   * the current requirements and helps track the evolution of API functionality
   * as business requirements change.
   *
   * The step value enables proper synchronization between operation definitions
   * and the underlying requirements, ensuring that the API behavior remains
   * relevant to the current project scope and business objectives.
   */
  step: number;
}
