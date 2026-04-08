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

export const test_realize_operation_preliminary_pagination = (): void => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[IArticle]>().components.schemas as Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive
    >;

  const articleTransformer: AutoBeRealizeTransformerFunction =
    createMockTransformer({
      dtoTypeName: "IArticle",
      databaseSchemaName: "articles",
    });

  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "patch",
    path: "/articles",
    responseBody: { typeName: "IPageIArticle" },
  });

  const result: AutoBeRealizeTransformerFunction[] =
    AutoBeRealizeOperationProgrammer.getLocalTransformers({
      operation,
      schemas,
      transformers: [articleTransformer],
    });

  TestValidator.equals(
    "should return 1 transformer for IPage-wrapped type",
    result.length,
    1,
  );
  TestValidator.equals(
    "should match article transformer",
    result[0],
    articleTransformer,
  );
};
