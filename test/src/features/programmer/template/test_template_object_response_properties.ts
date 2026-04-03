import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";
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

export const test_template_object_response_properties = (): void => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[IDashboard, IArticle, IUser]>().components
      .schemas as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "get",
    path: "/dashboard",
    responseBody: { typeName: "IDashboard" },
  });

  const result: string = writeRealizeOperationTemplate({
    scenario: createMockScenario(operation),
    operation,
    imports: [],
    authorization: null,
    schemas,
    collectors: [],
    transformers: [
      createMockTransformer({
        dtoTypeName: "IArticle",
        databaseSchemaName: "articles",
      }),
      createMockTransformer({
        dtoTypeName: "IUser",
        databaseSchemaName: "users",
      }),
    ],
  });

  const expectedBody: string = [
    `export async function getTest(): Promise<IDashboard> {`,
    `  return {`,
    `    articles: await ArrayUtil.asyncMap(..., (r) => ArticleTransformer.transform(r)),`,
    `    owner: await UserTransformer.transform(...),`,
    `    totalCount: ...,`,
    `  };`,
    `}`,
  ].join("\n");

  TestValidator.equals("full body", result.includes(expectedBody), true);
};
