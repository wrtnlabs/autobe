import { IAutoBeRealizeScenarioResult } from "@autobe/agent/src/orchestrate/realize/structures/IAutoBeRealizeScenarioResult";
import { AutoBeOpenApi } from "@autobe/interface";

export function createMockScenario(
  operation: AutoBeOpenApi.IOperation,
): IAutoBeRealizeScenarioResult {
  return {
    operation,
    functionName: `${operation.method}Test`,
    location: `src/providers/${operation.method}Test.ts`,
  };
}
