import { OpenApi } from "@samchon/openapi";

/**
 * Request body information of OpenAPI operation.
 *
 * This interface defines the structure for request bodies in API routes.
 * It corresponds to the requestBody section in OpenAPI specifications,
 * providing both a description and schema reference for the request payload.
 *
 * The content-type for all request bodies is always `application/json`.
 * Even when file uploading is required, don't use `multipart/form-data`
 * or `application/x-www-form-urlencoded` content types. Instead, just
 * define an URI string property in the request body schema.
 *
 * Note that, all {@link body request body} schemas must be
 * {@link OpenApi.IJsonSchema.IReference reference} type defined in
 * the {@link IAutoBeRouteDocument.IComponents components} section as
 * an {@link OpenApi.IJsonSchema.IObject object} type.
 *
 * In OpenAPI, this might represent:
 *
 * ```json
 * {
 *   "requestBody": {
 *     "description": "Creation info of the order",
 *     "content": {
 *       "application/json": {
 *         "schema": { "$ref": "#/components/schemas/IShoppingOrder.ICreate" }
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * @author Samchon
 */
export interface IAutoBeRouteBody {
  /**
   * Description about the request body.
   *
   * This provides context about what the request body represents
   * and how it should be used.
   *
   * It appears in the OpenAPI documentation to help API consumers
   * understand the purpose of the payload.
   */
  description: string;

  /**
   * Request body type.
   *
   * This specifies the data structure expected in the request body,
   * using a {@link OpenApi.IJsonSchema.IReference reference} type defined
   * in the {@link IAutoBeRouteDocument.IComponents components} section as
   * an {@link OpenApi.IJsonSchema.Object object} type.
   *
   * Therefore, its `$ref` property must start with `#/components/schemas/`
   * prefix. And its naming convention (of postfix) must follow below rules:
   *
   * - `IEntityName.ICreate`: Request body for creation operations (POST)
   * - `IEntityName.IUpdate`: Request body for update operations (PUT)
   * - `IEntityName.IRequest`: Request parameters for list operations (often with search/pagination)
   *
   * ```json
   * {
   *   "schema": {
   *     "$ref": "#/components/schemas/IShoppingOrder.ICreate"
   *   }
   * }
   * ```
   */
  schema: OpenApi.IJsonSchema.IReference;
}
