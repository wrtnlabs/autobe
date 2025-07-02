import { AutoBeOpenApi } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";

export interface RealizePlannerOutput {
  /**
   * The name of the function to be generated.
   *
   * Derived from the Swagger path and method. Used as the function entry point
   * in both code generation and test code.
   */
  functionName: string;

  /**
   * Definition of path and query parameters extracted from the OpenAPI spec.
   *
   * Includes input values passed via URL path or query string. Used for type
   * definitions, validation, and function signature construction.
   */
  parameters: AutoBeOpenApi.IParameter;

  /**
   * Schema definition for the request body input.
   *
   * Extracted from the requestBody section of Swagger. Represents the input
   * data passed in the body (e.g., JSON). Used for generating function
   * arguments or DTOs.
   */
  inputSchema: AutoBeOpenApi.IRequestBody;

  /**
   * Schema definition for the response body.
   *
   * Extracted from the responses section of Swagger. Used to define the return
   * type and expected output in test code.
   */
  outputSchema: AutoBeOpenApi.IResponseBody;

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
  operationType: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

  /**
   * List of scenario descriptions for test code generation.
   *
   * Each scenario describes the expected behavior of the function under certain
   * conditions. Used as a basis for TDD-style automated test generation.
   */
  testScenarios: string[];
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
 * @param ctx - AutoBE context including model and configuration
 * @param operation - A single OpenAPI operation object to analyze and plan
 * @returns A planning object containing all structural information needed to
 *   generate the function
 */
export const orchestrateRealizePlanner = async <Model extends ILlmSchema.Model>(
  ctx: AutoBeContext<Model>,
  operation: AutoBeOpenApi.IOperation,
): Promise<RealizePlannerOutput> => {
  ctx;
  operation;

  return null!;
};
