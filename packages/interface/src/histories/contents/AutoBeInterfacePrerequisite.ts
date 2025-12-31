import { AutoBeOpenApi } from "../../openapi/AutoBeOpenApi";

/**
 * Interface representing the prerequisite dependency analysis result for an API
 * operation.
 *
 * This interface maps an API endpoint to its required prerequisite operations,
 * which are POST operations that must be executed first to create the necessary
 * resources. The prerequisite analysis ensures proper resource creation order
 * for E2E test generation and operation sequencing.
 *
 * The prerequisite chain follows a depth-1 rule, meaning only direct
 * dependencies are analyzed without recursively examining prerequisites of
 * prerequisites. This eliminates circular reference concerns and keeps the
 * dependency graph simple and predictable.
 *
 * All prerequisites are restricted to POST method operations only, as they
 * represent resource creation endpoints that establish the necessary data for
 * subsequent operations to succeed.
 *
 * @author Samchon
 */
export interface AutoBeInterfacePrerequisite {
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
}
