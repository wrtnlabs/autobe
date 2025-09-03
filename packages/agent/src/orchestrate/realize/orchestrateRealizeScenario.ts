import {
  AutoBeOpenApi,
  AutoBeRealizeAuthorization,
  AutoBeTestFile,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "../../context/AutoBeContext";
import { IAutoBeRealizeScenarioResult } from "./structures/IAutoBeRealizeScenarioResult";

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
): IAutoBeRealizeScenarioResult => {
  const testFiles: AutoBeTestFile[] =
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
    testFiles: testFiles,
    decoratorEvent: authorization,
  };
};
