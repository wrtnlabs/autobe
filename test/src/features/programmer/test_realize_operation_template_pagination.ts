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
}

export const test_realize_operation_template_pagination = (): void => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[IArticle]>().components.schemas as Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive
    >;

  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "patch",
    path: "/articles",
    responseBody: { typeName: "IPageIArticle" },
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
    export async function patchTest(): Promise<IPageIArticle> {
      const records = await MyGlobal.prisma.articles.findMany({
        ...ArticleTransformer.select(),
        ...,
      });
      return {
        pagination: {
          current: ...,
          limit: ...,
          records: ...,
          pages: ...,
        },
        data: await ArrayUtil.asyncMap(records, ArticleTransformer.transform),
      };
    }
  `;

  const normalize = (s: string): string =>
    s
      .split("\n")
      .map((l) => l.trimStart())
      .join("\n");
  TestValidator.equals(
    "full body",
    normalize(result).includes(normalize(expectedBody)),
    true,
  );
};
