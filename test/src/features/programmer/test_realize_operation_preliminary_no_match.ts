import { AutoBeRealizeOperationProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeOperationProgrammer";
import {
  AutoBeOpenApi,
  AutoBeRealizeTransformerFunction,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockTransformer } from "./internal/createMockTransformer";

interface IArticle {
  id: string & tags.Format<"uuid">;
  title: string;
}

export const test_realize_operation_preliminary_no_match = (): void => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[IArticle]>().components.schemas as Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive
    >;

  const operation = createMockOperation({
    method: "get",
    path: "/articles/{id}",
    responseBody: { typeName: "IArticle" },
  });

  // Transformer for a completely different type
  const result: AutoBeRealizeTransformerFunction[] =
    AutoBeRealizeOperationProgrammer.getLocalTransformers({
      operation,
      schemas,
      transformers: [
        createMockTransformer({
          dtoTypeName: "IUser",
          databaseSchemaName: "users",
        }),
      ],
    });

  TestValidator.equals(
    "should return empty when no transformer matches",
    result.length,
    0,
  );
};
