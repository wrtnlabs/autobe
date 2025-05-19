import { IAutoBeRouteBody } from "./IAutoBeRouteBody";
import { IAutoBeRouteParameter } from "./IAutoBeRouteParameter";
import { IAutoBeRouteResponse } from "./IAutoBeRouteResponse";

/**
 * Operation of the Restful API.
 *
 * This interface defines a single API endpoint with its
 * HTTP {@link method}, {@link path}, {@link parameters path parameters},
 * {@link request body body}, and {@link response} structure. It corresponds
 * to an individual operation in the paths section of an OpenAPI document.
 *
 * Each operation requires a detailed explanation of its purpose through
 * the reason and description fields, making it clear why the API was
 * designed and how it should be used.
 *
 * All request bodies and responses for this operation must be object types
 * and must reference named types defined in the components section.
 * The content-type is always `application/json`. For file upload/download
 * operations, use `string & tags.Format<"uri">` in the appropriate schema
 * instead of binary data formats.
 *
 * In OpenAPI, this might represent:
 *
 * ```json
 * {
 *   "/shoppings/customers/orders": {
 *     "post": {
 *       "description": "Create a new order application from shopping cart...",
 *       "parameters": [...],
 *       "requestBody": {...},
 *       "responses": {...}
 *     }
 *   }
 * }
 * ```
 *
 * @author Samchon
 */
export interface IAutoBeRouteOperation {
  /**
   * Specification of the API operation.
   *
   * Before defining the API operation interface, please describe
   * what you're planning to write in this `specification` field.
   *
   * The specification must be fully detailed and clear, so that anyone can
   * understand the purpose and functionality of the API operation and its
   * related components (e.g., {@link path}, {@link parameters}, {@link body}).
   */
  specification: string;

  /**
   * HTTP path of the API operation.
   *
   * The URL path for accessing this API operation, using path parameters
   * enclsed in curly braces (e.g., `/shoppings/customers/sales/{saleId}`).
   *
   * It must be corresponded to the {@link parameters path parameters}.
   */
  path: string;

  /**
   * HTTP method of the API operation.
   *
   * Note that, if the API operation has {@link body}, method must not be `get`.
   *
   * Also, even though the API operation has been designed to only get
   * information, but it needs complicated request information, it must
   * be defined as `patch` method with {@link body} data specification.
   *
   * - `get`: get information
   * - `patch`: get information with complicated request data ({@link body})
   * - `post`: create new record
   * - `put`: update existing record
   * - `delete`: remove record
   */
  method: "get" | "post" | "put" | "delete" | "patch";

  /**
   * Detailed description about the API operation.
   *
   * Please describe the API operation in a human-readable way,
   * and must be enough detailed to be used as a document.
   * This description will be used for the next step of viral coding,
   * implementation of e2e test functions and main program development.
   *
   * If there's a dependency to other APIs, please describe the
   * dependency API operation in this field with detailed reason.
   * For example, if this API operation needs a pre-execution of
   * other API operation, it must be explicitly described.
   *
   * - `GET /shoppings/customers/sales` must be pre-executed to
   *   get entire list of summarized sales. Detailed sale information
   *   would be obtained by specifying the sale ID in the path parameter.
   */
  description: string;

  /**
   * List of path parameters.
   *
   * Note that, the {@link IAutoBeRouteParameter.name identifier name} of
   * path parameter must be corresponded to the {@link path API operation path}.
   *
   * For example, if there's an API operation which has {@link path} of
   * `/shoppings/customers/sales/{saleId}/questions/${questionId}/comments/${commentId}`,
   * its list of {@link IAutoBeRouteParameter.name path parameters} must be like:
   *
   * - `saleId`
   * - `questionId`
   * - `commentId`
   */
  parameters: IAutoBeRouteParameter[];

  /**
   * Request body of the API operation.
   *
   * Defines the payload structure for the request. Contains a description
   * and schema reference to define the expected input data.
   *
   * Should be `null` for operations that don't require a request body,
   * such as most "get" operations.
   */
  body: IAutoBeRouteBody | null;

  /**
   * Response body of the API operation.
   *
   * Defines the structure of the successful response data. Contains a
   * description and schema reference for the returned data.
   *
   * Should be null for operations that don't return any data.
   */
  response: IAutoBeRouteResponse | null;
}
