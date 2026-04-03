import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";

interface ISomething {
  id: string & tags.Format<"uuid">;
  value: number;
}

export const test_realize_operation_template_no_match_fallback = (): void => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[ISomething]>().components.schemas as Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive
    >;

  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "get",
    path: "/something",
    responseBody: { typeName: "ISomething" },
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
    "full body",
    result.includes("export async function getTest(): Promise<ISomething> {"),
    true,
  );
  TestValidator.equals(
    "fallback comment",
    result.includes("No matching Collector/Transformer found"),
    true,
  );
  TestValidator.equals(
    "getDatabaseSchemas hint",
    result.includes("getDatabaseSchemas"),
    true,
  );
};
