import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";

interface IStats {
  count: number;
  average: number;
}

export const test_realize_operation_template_object_no_property_match =
  (): void => {
    const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
      typia.json.schemas<[IStats]>().components.schemas as Record<
        string,
        AutoBeOpenApi.IJsonSchemaDescriptive
      >;

    const operation: AutoBeOpenApi.IOperation = createMockOperation({
      method: "get",
      path: "/stats",
      responseBody: { typeName: "IStats" },
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

    const expectedBody: string = [
      `export async function getTest(): Promise<IStats> {`,
      `  ...`,
      `}`,
    ].join("\n");

    TestValidator.equals("full body", result.includes(expectedBody), true);
    TestValidator.equals(
      "no Transformer reference",
      result.includes("Transformer"),
      false,
    );
    TestValidator.equals(
      "no Collector reference",
      result.includes("Collector"),
      false,
    );
  };
