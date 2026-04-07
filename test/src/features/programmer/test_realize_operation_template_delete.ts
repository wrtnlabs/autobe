import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";

interface IArticle {
  id: string & tags.Format<"uuid">;
  title: string;
}

export const test_realize_operation_template_delete = (): void => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[IArticle]>().components.schemas as Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive
    >;

  const operation: AutoBeOpenApi.IOperation = createMockOperation({
    method: "delete",
    path: "/articles/{id}",
    parameters: [
      {
        name: "id" as AutoBeOpenApi.IParameter["name"],
        description: "Article ID",
        schema: { type: "string", format: "uuid" },
      },
    ],
  });

  const result: string = writeRealizeOperationTemplate({
    scenario: createMockScenario(operation),
    operation,
    imports: [],
    authorization: null,
    schemas,
    collectors: [],
    transformers: [],
  });

  const expectedBody: string = StringUtil.trim`
    export async function deleteTest(props: {
      id: string & tags.Format<"uuid">;
    }): Promise<void> {
      await MyGlobal.prisma.....delete({
        where: { ... },
      });
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
