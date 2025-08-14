import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

/**
 * Event fired when the Interface agent defines API operations during the
 * RESTful API specification process.
 *
 * This event occurs when the Interface agent is creating detailed operation
 * specifications that define the role, behavior, and characteristics of each
 * API function. Operations include comprehensive business logic definitions,
 * parameter specifications, response schemas, error handling, and security
 * requirements that transform endpoint definitions into fully functional API
 * contracts.
 *
 * The operation definition process ensures that each API endpoint has complete
 * behavioral specifications, proper documentation, and clear contracts that
 * enable accurate code generation and reliable client integration.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceOperationsEvent
  extends AutoBeEventBase<"interfaceOperations">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
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
