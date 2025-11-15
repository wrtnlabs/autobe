import { AutoBeOpenApi, AutoBeRealizeAuthorization } from "@autobe/interface";

import { IAutoBeRealizeScenarioResult } from "../structures/IAutoBeRealizeScenarioResult";

/**
 * Generates a planning result that defines what kind of function should be
 * created based on the provided Swagger (OpenAPI) operation.
 *
 * This function analyzes the structure of the OpenAPI operation (such as the
 * path, method, parameters, request/response schema, and descriptions) to
 * determine the appropriate function name, input/output types, and purpose of
 * the function.
 *
 * The result of this function is passed to the next step in the AutoBE
 * pipeline, which is responsible for generating the actual implementation
 * code.
 *
 * @author Kakasoo
 * @param ctx - AutoBE context including model and configuration
 * @param operation - A single OpenAPI operation object to analyze and plan
 * @param authorization - Optional authorization configuration
 * @returns A scenario object containing all structural information needed to
 *   generate the function
 */
export function generateRealizeScenario(
  operation: AutoBeOpenApi.IOperation,
  authorizations: AutoBeRealizeAuthorization[],
): IAutoBeRealizeScenarioResult {
  const authorization = authorizations.find(
    (el) => el.actor.name === operation.authorizationActor,
  );
  const functionName: string = transformFunctionName(operation);

  return {
    operation: operation,
    functionName: functionName,
    location: `src/providers/${functionName}.ts`,
    decoratorEvent: authorization,
  };
}

/**
 * Transforms an OpenAPI operation into a unique function name that will be used
 * by Realize Write and Realize Correct agents to generate the actual
 * implementation.
 *
 * The generated function name follows camelCase convention and ensures
 * uniqueness by combining HTTP method with the URL path segments.
 *
 * @example
 *   POST /api/v1/users → postApiV1Users
 *   GET /users/{userId}/posts → getUsersUserIdPosts
 *   PUT /users/{user-id}/profile → putUsersUserIdProfile
 *
 * @param operation - The OpenAPI operation to transform
 * @returns A unique function name that will be the actual function name in the
 *   generated code by Realize Write/Correct agents
 */
function transformFunctionName(operation: AutoBeOpenApi.IOperation): string {
  const functionName = `${operation.method}${operation.path
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      if (segment.startsWith("{") && segment.endsWith("}")) {
        // {userId} → UserId
        const paramName = segment.slice(1, -1);
        return paramName
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join("");
      }
      // api → Api, v1 → V1
      const words = segment.split("-");
      return words
        .map((word) => {
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join("");
    })
    .join("")}`;
  return functionName;
}
