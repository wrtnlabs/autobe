import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";

export const test_realize_operation_template_param_string_tags = (): void => {
  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "get",
    path: "/search/{query}",
    parameters: [
      {
        name: "query" as AutoBeOpenApi.IParameter["name"],
        description: "Search query",
        schema: {
          type: "string",
          format: "uri",
          contentMediaType: "text/plain",
          pattern: "^[a-z]+$",
          minLength: 1,
          maxLength: 255,
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
    "has Format tag",
    result.includes(`tags.Format<"uri">`),
    true,
  );
  TestValidator.equals(
    "has ContentMediaType tag",
    result.includes(`tags.ContentMediaType<"text/plain">`),
    true,
  );
  TestValidator.equals(
    "has Pattern tag",
    result.includes(`tags.Pattern<"^[a-z]+$">`),
    true,
  );
  TestValidator.equals(
    "has MinLength tag",
    result.includes("tags.MinLength<1>"),
    true,
  );
  TestValidator.equals(
    "has MaxLength tag",
    result.includes("tags.MaxLength<255>"),
    true,
  );
};
