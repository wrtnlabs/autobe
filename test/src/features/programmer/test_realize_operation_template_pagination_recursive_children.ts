import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";
import { createMockTransformer } from "./internal/createMockTransformer";

/**
 * A DTO with only a 1:N self-reference (children array, no parent property).
 * The pagination operation template must still use transformAll() rather than
 * ArrayUtil.asyncMap(), because the DTO is recursive in the children
 * direction.
 */
interface IFolder {
  id: string & tags.Format<"uuid">;
  name: string;
  children: IFolder[];
}

export const test_realize_operation_template_pagination_recursive_children =
  (): void => {
    const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
      typia.json.schemas<[IFolder]>().components.schemas as Record<
        string,
        AutoBeOpenApi.IJsonSchemaDescriptive
      >;

    const operation: AutoBeOpenApi.IOperation = createMockOperation({
      method: "get",
      path: "/folders",
      responseBody: { typeName: "IPageIFolder" },
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
          dtoTypeName: "IFolder",
          databaseSchemaName: "folders",
        }),
      ],
    });

    const expectedBody: string = StringUtil.trim`
      export async function getTest(): Promise<IPageIFolder> {
        const records = await MyGlobal.prisma.folders.findMany({
          ...FolderTransformer.select(),
          ...,
        });
        return {
          pagination: {
            current: ...,
            limit: ...,
            records: ...,
            pages: ...,
          },
          data: await FolderTransformer.transformAll(records),
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
