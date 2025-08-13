import { AutoBeOpenApi, AutoBeRealizeAuthorization } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeRealizeScenarioApplication } from "./structures/IAutoBeRealizeScenarioApplication";

export interface IAutoBeRealizeScenario {
  /**
   * The name of the function to be generated.
   *
   * Derived from the Swagger path and method. The function name must be written
   * in snake_case. It serves as the entry point in both code generation and
   * test code.
   *
   * Once the function is generated, the function name and file name will be the
   * same. The generated file will be located at
   * `src/providers/${function_name}.ts`.
   */
  functionName: string;

  /**
   * Definition of path and query parameters extracted from the OpenAPI spec.
   *
   * Includes input values passed via URL path or query string. Used for type
   * definitions, validation, and function signature construction.
   */
  parameters: AutoBeOpenApi.IParameter[];

  /**
   * Schema definition for the request body input.
   *
   * Extracted from the requestBody section of Swagger. Represents the input
   * data passed in the body (e.g., JSON). Used for generating function
   * arguments or DTOs.
   */
  inputSchema: AutoBeOpenApi.IRequestBody | null;

  /**
   * Schema definition for the response body.
   *
   * Extracted from the responses section of Swagger. Used to define the return
   * type and expected output in test code.
   */
  outputSchema: AutoBeOpenApi.IResponseBody | null;

  /**
   * Natural language description of the function’s purpose.
   *
   * Extracted from the summary or description field of Swagger. Used for code
   * documentation, test scenario generation, and conveying function intent.
   */
  description: string;

  /**
   * HTTP method information.
   *
   * Extracted from the Swagger operation method. Used to define the request
   * type during code and test generation.
   */
  method: "get" | "post" | "put" | "delete" | "patch";

  /**
   * List of scenario descriptions for test code generation.
   *
   * Each scenario describes the expected behavior of the function under certain
   * conditions. Used as a basis for TDD-style automated test generation.
   */
  testScenarios: string[];

  /**
   * Optional decorator event for customizing code generation behavior.
   *
   * Provides additional metadata or instructions that can modify how the
   * function implementation is generated. Can include custom annotations,
   * middleware configurations, or special handling directives that affect the
   * final code output.
   */
  decoratorEvent?: AutoBeRealizeAuthorization;
}

/**
 * Generates a planning result that defines what kind of function should be
 * created, based solely on the provided Swagger (OpenAPI) operation — without
 * using an LLM.
 *
 * This function analyzes the structure of the OpenAPI operation (such as the
 * path, method, parameters, request/response schema, and descriptions) to
 * determine the appropriate function name, input/output types, and purpose of
 * the function.
 *
 * The result of this function (`RealizePlannerOutput`) will be passed to the
 * next step in the AutoBE pipeline, which is responsible for generating the
 * actual implementation code.
 *
 * @author Kakasoo
 * @param ctx - AutoBE context including model and configuration
 * @param operation - A single OpenAPI operation object to analyze and plan
 * @returns A planning object containing all structural information needed to
 *   generate the function
 */
export const orchestrateRealizeScenario = <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operation: AutoBeOpenApi.IOperation,
  authorization?: AutoBeRealizeAuthorization,
): IAutoBeRealizeScenarioApplication.IProps => {
  const testScenarios =
    ctx
      .state()
      .test?.files.filter(
        (el) =>
          el.scenario.endpoint.method === operation.method &&
          el.scenario.endpoint.path === operation.path,
      ) ?? [];

  const functionName = `${operation.method}_${operation.path
    .replaceAll("/", "_")
    .replaceAll("-", "_")
    .replaceAll("{", "$")
    .replaceAll("}", "")}`;
  return {
    operation: operation,
    functionName: functionName,
    location: `src/providers/${functionName}.ts`,
    testScenarios: testScenarios.map((el) => el.scenario.draft),
    decoratorEvent: authorization,
  };
};
