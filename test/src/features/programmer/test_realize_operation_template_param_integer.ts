import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";

export const test_realize_operation_template_param_integer = (): void => {
  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "get",
    path: "/pages/{page}",
    parameters: [
      {
        name: "page" as AutoBeOpenApi.IParameter["name"],
        description: "Page number",
        schema: { type: "integer" },
      },
    ],
    responseBody: null,
  });

  const result: string = writeRealizeOperationTemplate({
    scenario: createMockScenario(operation),
    operation,
    imports: [],
    authorization: null,
    schemas: {},
    collectors: [],
    transformers: [],
  });

  TestValidator.equals(
    "integer becomes number & tags.Type<int32>",
    result.includes(`page: number & tags.Type<"int32">`),
    true,
  );
};
