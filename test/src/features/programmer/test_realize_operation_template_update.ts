import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";
import { createMockTransformer } from "./internal/createMockTransformer";

interface IArticle {
  id: string & tags.Format<"uuid">;
  title: string;
  body: string;
}
namespace IArticle {
  export interface IUpdate {
    title: string;
  }
}

export const test_realize_operation_template_update = (): void => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[IArticle, IArticle.IUpdate]>().components
      .schemas as Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "put",
    path: "/articles/{id}",
    parameters: [
      {
        name: "id" as AutoBeOpenApi.IParameter["name"],
        description: "Article ID",
        schema: { type: "string", format: "uuid" },
      },
    ],
    requestBody: { typeName: "IArticle.IUpdate" },
    responseBody: { typeName: "IArticle" },
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
    ],
  });

  const expectedBody: string = StringUtil.trim`
    export async function putTest(props: {
      id: string & tags.Format<"uuid">;
      body: IArticle.IUpdate;
    }): Promise<IArticle> {
      await MyGlobal.prisma.articles.update({
        where: { ... },
        data: { ... },
      });
      const updated = await MyGlobal.prisma.articles.findUniqueOrThrow({
        where: { ... },
        ...ArticleTransformer.select(),
      });
      return await ArticleTransformer.transform(updated);
    }
  `;

  const normalize = (s: string): string =>
    s.split("\n").map((l) => l.trimStart()).join("\n");
  TestValidator.equals(
    "full body",
    normalize(result).includes(normalize(expectedBody)),
    true,
  );
};
