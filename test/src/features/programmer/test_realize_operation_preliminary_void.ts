import { AutoBeRealizeOperationProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeOperationProgrammer";
import { AutoBeRealizeTransformerFunction } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockTransformer } from "./internal/createMockTransformer";

export const test_realize_operation_preliminary_void = (): void => {
  const operation = createMockOperation({
    method: "delete",
    path: "/articles/{id}",
    responseBody: null,
  });

  const result: AutoBeRealizeTransformerFunction[] =
    AutoBeRealizeOperationProgrammer.getLocalTransformers({
      operation,
      schemas: {},
      transformers: [
        createMockTransformer({
          dtoTypeName: "IArticle",
          databaseSchemaName: "articles",
        }),
      ],
    });

  TestValidator.equals(
    "should return empty for void response",
    result.length,
    0,
  );
};
