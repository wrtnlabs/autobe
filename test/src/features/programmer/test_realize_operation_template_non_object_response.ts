import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";

type StringArray = string[];

export const test_realize_operation_template_non_object_response = (): void => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[StringArray]>().components.schemas as Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive
    >;

  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "get",
    path: "/tags",
    responseBody: { typeName: "StringArray" },
  });

  const result: string = writeRealizeOperationTemplate({
    scenario: createMockScenario(operation),
    operation,
    imports: [],
    authorization: null,
    schemas,
    collectors: [],
    transformers: [],
  });

  TestValidator.equals(
    "falls through to fallback",
    result.includes("export async function getTest(): Promise<StringArray> {"),
    true,
  );
  TestValidator.equals(
    "fallback comment",
    result.includes("No matching Collector/Transformer found"),
    true,
  );
};
