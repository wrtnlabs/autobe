import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";
import { createMockTransformer } from "./internal/createMockTransformer";

interface ICategory {
  id: string & tags.Format<"uuid">;
  name: string;
  parent: ICategory | null;
}

export const test_realize_operation_template_pagination_recursive =
  (): void => {
    const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
      typia.json.schemas<[ICategory]>().components.schemas as Record<
        string,
        AutoBeOpenApi.IJsonSchemaDescriptive
      >;

    const operation: AutoBeOpenApi.IOperation = createMockOperation({
      method: "patch",
      path: "/categories",
      responseBody: { typeName: "IPageICategory" },
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
          dtoTypeName: "ICategory",
          databaseSchemaName: "categories",
        }),
      ],
    });

    const expectedBody: string = [
      `export async function patchTest(): Promise<IPageICategory> {`,
      `  const records = await MyGlobal.prisma.categories.findMany({`,
      `    ...CategoryTransformer.select(),`,
      `    ...,`,
      `  });`,
      `  return {`,
      `    pagination: {`,
      `      current: ...,`,
      `      limit: ...,`,
      `      records: ...,`,
      `      pages: ...,`,
      `    },`,
      `    data: await CategoryTransformer.transformAll(records),`,
      `  };`,
      `}`,
    ].join("\n");

    TestValidator.equals("full body", result.includes(expectedBody), true);
  };
