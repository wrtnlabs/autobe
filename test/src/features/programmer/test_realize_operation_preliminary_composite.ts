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

interface IUser {
  id: string & tags.Format<"uuid">;
  name: string;
}

interface IDashboard {
  articles: IArticle[];
  owner: IUser;
  totalCount: number;
}

export const test_realize_operation_preliminary_composite = (): void => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[IDashboard, IArticle, IUser]>().components
      .schemas as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  const articleTransformer: AutoBeRealizeTransformerFunction =
    createMockTransformer({
      dtoTypeName: "IArticle",
      databaseSchemaName: "articles",
    });
  const userTransformer: AutoBeRealizeTransformerFunction =
    createMockTransformer({
      dtoTypeName: "IUser",
      databaseSchemaName: "users",
    });

  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "get",
    path: "/dashboard",
    responseBody: { typeName: "IDashboard" },
  });

  const result: AutoBeRealizeTransformerFunction[] =
    AutoBeRealizeOperationProgrammer.getLocalTransformers({
      operation,
      schemas,
      transformers: [articleTransformer, userTransformer],
    });

  TestValidator.equals(
    "should return 2 transformers for composite",
    result.length,
    2,
  );
  TestValidator.equals(
    "should include article transformer",
    result.includes(articleTransformer),
    true,
  );
  TestValidator.equals(
    "should include user transformer",
    result.includes(userTransformer),
    true,
  );
};
