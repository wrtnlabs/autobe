import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";

export const test_realize_operation_template_param_number_tags = (): void => {
  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "get",
    path: "/items/{price}",
    parameters: [
      {
        name: "price" as AutoBeOpenApi.IParameter["name"],
        description: "Price filter",
        schema: {
          type: "number",
          minimum: 0,
          maximum: 10000,
          exclusiveMinimum: -1,
          exclusiveMaximum: 10001,
          multipleOf: 0.01,
        },
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
    "has Minimum tag",
    result.includes("tags.Minimum<0>"),
    true,
  );
  TestValidator.equals(
    "has Maximum tag",
    result.includes("tags.Maximum<10000>"),
    true,
  );
  TestValidator.equals(
    "has ExclusiveMinimum tag",
    result.includes("tags.ExclusiveMinimum<-1>"),
    true,
  );
  TestValidator.equals(
    "has ExclusiveMaximum tag",
    result.includes("tags.ExclusiveMaximum<10001>"),
    true,
  );
  TestValidator.equals(
    "has MultipleOf tag",
    result.includes("tags.MultipleOf<0.01>"),
    true,
  );
};
