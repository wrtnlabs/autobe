import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";

export const test_realize_operation_template_multiple_params = (): void => {
  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "get",
    path: "/users/{userId}/articles/{articleId}",
    parameters: [
      {
        name: "userId" as AutoBeOpenApi.IParameter["name"],
        description: "User ID",
        schema: { type: "string", format: "uuid" },
      },
      {
        name: "articleId" as AutoBeOpenApi.IParameter["name"],
        description: "Article ID",
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
    "userId param",
    result.includes(`userId: string & tags.Format<"uuid">`),
    true,
  );
  TestValidator.equals(
    "articleId param",
    result.includes(`articleId: number & tags.Type<"int32">`),
    true,
  );
  TestValidator.equals("has props wrapper", result.includes("props: {"), true);
};
