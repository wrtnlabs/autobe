import { OpenApi } from "@samchon/openapi";

/**
 * Path parameter information for API routes.
 *
 * This interface defines a path parameter that appears in the URL of
 * an API endpoint. Path parameters are enclosed in curly braces in the
 * {@link IAutoBeRouteOperation.path operation path} and must be defined
 * with their types and descriptions.
 *
 * For example, if API operation path is
 * `/shoppings/customers/sales/{saleId}/questions/${questionId}/comments/${commentId}`,
 * the path parameters should be like below:
 *
 * ```json
 * {
 *   "path": "/shoppings/customers/sales/{saleId}/questions/${questionId}/comments/${commentId}",
 *   "method": "get",
 *   "parameters": [
 *     {
 *       "name": "saleId",
 *       "in": "path",
 *       "schema": { "type": "string", "format": "uuid" },
 *       "description": "Target sale's ID"
 *     },
 *     {
 *       "name": "questionId",
 *       "in": "path",
 *       "schema": { "type": "string", "format": "uuid" },
 *       "description": "Target question's ID"
 *     },
 *     {
 *       "name": "commentId",
 *       "in": "path",
 *       "schema": { "type": "string", "format": "uuid" },
 *       "description": "Target comment's ID"
 *     }
 *   ]
 * }
 * ```
 *
 * @author Samchon
 */
export interface IAutoBeRouteParameter {
  /**
   * Identifier name of the path parameter.
   *
   * This name must match exactly with the parameter name in the route path.
   * It must be corresponded to the {@link path API operation path}.
   */
  name: string;

  /**
   * Description about the path parameter.
   *
   * Provides context about what the parameter represents and its purpose
   * in the API operation. This helps API consumers understand how to use
   * the parameter correctly.
   */
  description: string;

  /**
   * Type schema of the path parameter.
   *
   * Path parameters are typically primitive types like
   * {@link OpenApi.IJsonSchema.IString strings},
   * {@link OpenApi.IJsonSchema.IInteger integers},
   * {@link OpenApi.IJsonSchema.INumber numbers},
   * or constant values of them.
   */
  schema:
    | OpenApi.IJsonSchema.IBoolean
    | OpenApi.IJsonSchema.IInteger
    | OpenApi.IJsonSchema.INumber
    | OpenApi.IJsonSchema.IString
    | OpenApi.IJsonSchema.IConstant;
}
