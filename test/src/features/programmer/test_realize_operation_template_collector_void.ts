import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

import { createMockCollector } from "./internal/createMockCollector";
import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";

namespace IArticle {
  export interface ICreate {
    title: string;
  }
}

export const test_realize_operation_template_collector_void = (): void => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[IArticle.ICreate]>().components.schemas as Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive
    >;

  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "post",
    path: "/articles",
    requestBody: { typeName: "IArticle.ICreate" },
    responseBody: null,
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
    transformers: [],
  });

  const expectedBody: string = [
    `export async function postTest(props: {`,
    `  body: IArticle.ICreate;`,
    `}): Promise<void> {`,
    `  await MyGlobal.prisma.articles.create({`,
    `    data: await ArticleCollector.collect({`,
    `      body: props.body,`,
    `      ...`,
    `    }),`,
    `  });`,
    `}`,
  ].join("\n");

  TestValidator.equals("full body", result.includes(expectedBody), true);
};
