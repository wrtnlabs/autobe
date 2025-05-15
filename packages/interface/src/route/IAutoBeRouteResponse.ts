import { OpenApi } from "@samchon/openapi";

/**
 * Response body information for OpenAPI operation.
 *
 * This interface defines the structure of a successful response from
 * an API operation. It provides a description of the response and a schema
 * reference to define the returned data structure.
 *
 * The content-type for all responses is always `application/json`.
 * Even when file downloading is required, don't use `application/octet-stream`
 * or `multipart/form-data` content types. Instead, just define an URI string
 * property in the response body schema.
 *
 * In OpenAPI, this might represent:
 *
 * ```json
 * {
 *   "responses": {
 *     "200": {
 *       "description": "Order information",
 *       "content": {
 *         "application/json": {
 *           "schema": { "$ref": "#/components/schemas/IShoppingOrder" }
 *         }
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * @author Samchon
 */
export interface IAutoBeRouteResponse {
  /**
   * Description about the response body.
   *
   * Provides context about what the response represents and what it contains.
   *
   * This helps API consumers understand the structure and meaning of the
   * returned data.
   */
  description: string;

  /**
   * Response body's data type.
   *
   * Specifies the structure of the returned data using a
   * {@link OpenApi.IJsonSchema.IReference reference} type.
   *
   * This schema must be a {@link OpenApi.IJsonSchema.IReference reference}
   * type targtting the {@link IAutoBeRouteDocument.components components}
   * section as an {@link OpenApi.IJsonSchema.Object object} type.
   *
   * Therefore, its `$ref` property must start with `#/components/schemas/`
   * prefix. And its naming convetion (of postfix) must follow below rules:
   *
   * - `IEntityName`: Main entity with detailed information (e.g., `IShoppingSale`)
   * - `IEntityName.ISummary`: Simplified response version with essential properties
   * - `IEntityName.IInvert`: Alternative view of an entity from a different perspective
   * - `IPageIEntityName`: Paginated results container with `pagination` and `data` properties
   *
   *  * ```json
   * {
   *   "schema": {
   *     "$ref": "#/components/schemas/IShoppingOrder"
   *   }
   * }
   * ```
   */
  schema: OpenApi.IJsonSchema.IReference;
}
