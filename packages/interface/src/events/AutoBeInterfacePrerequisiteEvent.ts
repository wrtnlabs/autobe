import { AutoBeOpenApi } from "../openapi";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event emitted when a single API operation's prerequisite dependencies are analyzed.
 *
 * This event is triggered when the Interface Prerequisite Agent completes
 * analyzing one API operation to determine its prerequisite dependencies. It
 * represents the result of establishing which POST operations must be executed
 * before the target operation can succeed, ensuring proper resource creation
 * order for E2E test generation.
 *
 * The prerequisite analysis examines the API operation to identify required
 * resource dependencies based on path parameters, request body schemas, and
 * entity relationships. For example, a `PUT /orders/{orderId}/items/{itemId}`
 * operation would require `POST /orders` and `POST /orders/{orderId}/items` as
 * prerequisites to create the necessary resources first.
 *
 * By extending multiple base interfaces, this event provides comprehensive
 * tracking capabilities including progress monitoring for one-by-one operation
 * processing and token usage analytics for cost optimization.
 *
 * @author Samchon
 */
export interface AutoBeInterfacePrerequisiteEvent
  extends
    AutoBeEventBase<"interfacePrerequisite">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * The API endpoint being analyzed for prerequisite dependencies.
   *
   * Identifies the specific operation (method + path) that requires
   * prerequisite operations to be executed first. This can be any HTTP method
   * (GET, POST, PUT, DELETE, PATCH) as all operations may have resource
   * dependencies that need to be satisfied.
   */
  endpoint: AutoBeOpenApi.IEndpoint;

  /**
   * Array of prerequisite POST operations required before this operation.
   *
   * Contains the list of API operations that must be successfully executed
   * before the target operation can be performed. Each prerequisite is a POST
   * operation that creates a required resource, derived from path parameter
   * dependencies, request body schema references, and entity relationships.
   *
   * For example, a `DELETE /orders/{orderId}/items/{itemId}` operation would
   * have prerequisites including `POST /orders` to create the order and `POST
   * /orders/{orderId}/items` to create the item being deleted.
   *
   * Prerequisites are ordered logically with parent resources before child
   * resources to ensure proper creation sequence.
   */
  prerequisites: AutoBeOpenApi.IPrerequisite[];

  /**
   * Iteration number of the Prisma schema this prerequisite analysis was
   * performed for.
   *
   * Indicates which version of the Prisma schema and interface specification
   * this analysis reflects. This step number ensures that the prerequisite
   * mappings are aligned with the current database schema and API structure.
   *
   * The step value enables proper synchronization between prerequisite analysis
   * and the underlying schema definitions, ensuring that dependency chains
   * remain valid as the schema evolves through iterations.
   */
  step: number;
}
