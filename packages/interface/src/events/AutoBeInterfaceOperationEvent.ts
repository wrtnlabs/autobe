import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired when the Interface agent defines API operations for an endpoint
 * during the RESTful API specification process.
 *
 * This event occurs when the Interface agent creates detailed operation
 * specifications for a single endpoint. Each endpoint may generate multiple
 * operations when different authorization actors are specified (e.g., one
 * endpoint with ["admin", "user"] actors generates two operations with
 * different path prefixes).
 *
 * Operations include comprehensive business logic definitions, parameter
 * specifications, response schemas, error handling, and security requirements
 * that transform an endpoint definition into fully functional API contracts.
 *
 * The operation definition process ensures that the endpoint has complete
 * behavioral specifications, proper documentation, and clear contracts that
 * enable accurate code generation and reliable client integration.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceOperationEvent
  extends
    AutoBeEventBase<"interfaceOperation">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Array of API operations generated for the endpoint.
   *
   * Contains the detailed {@link AutoBeOpenApi.IOperation} specifications
   * generated for a single endpoint. Multiple operations are created when
   * different authorization actors are specified - each actor generates a
   * separate operation with its own path prefix (e.g., "/admin/users" and
   * "/user/users" from a single "/users" endpoint).
   *
   * Each operation includes comprehensive documentation, request/response
   * schemas, error handling specifications, and security requirements that
   * transform the basic endpoint into complete API contracts.
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
   */
  step: number;
}
