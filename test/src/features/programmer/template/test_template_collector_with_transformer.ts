import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createMockCollector } from "./internal/createMockCollector";
import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";
import { createMockTransformer } from "./internal/createMockTransformer";

interface IArticle {
  id: string & tags.Format<"uuid">;
  title: string;
}
namespace IArticle {
  export interface ICreate {
    title: string;
  }
}

export const test_template_collector_with_transformer = (): void => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[IArticle, IArticle.ICreate]>().components
      .schemas as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "post",
    path: "/articles",
    requestBody: { typeName: "IArticle.ICreate" },
    responseBody: { typeName: "IArticle" },
  });

  const result: string = writeRealizeOperationTemplate({
    scenario: createMockScenario(operation),
    operation,
    imports: [],
    authorization: null,
    schemas,
    collectors: [
      createMockCollector({
        dtoTypeName: "IArticle.ICreate",
        databaseSchemaName: "articles",
      }),
    ],
    transformers: [
      createMockTransformer({
        dtoTypeName: "IArticle",
        databaseSchemaName: "articles",
      }),
    ],
  });

  const expectedBody: string = [
    `export async function postTest(props: {`,
    `  body: IArticle.ICreate;`,
    `}): Promise<IArticle> {`,
    `  const record = await MyGlobal.prisma.articles.create({`,
    `    data: await ArticleCollector.collect({`,
    `      body: props.body,`,
    `      ...`,
    `    }),`,
    `    ...ArticleTransformer.select(),`,
    `  });`,
    `  return await ArticleTransformer.transform(record);`,
    `}`,
  ].join("\n");

  TestValidator.equals("full body", result.includes(expectedBody), true);
};
