import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";
import { createMockTransformer } from "./internal/createMockTransformer";

/**
 * An object response type (not IPage*) that contains a property typed as
 * an array of a recursive DTO (children-only self-reference).
 *
 * The writeObjectBody path must detect the recursive DTO and emit
 * `FolderTransformer.transformAll(...)` instead of
 * `ArrayUtil.asyncMap(..., (r) => FolderTransformer.transform(r))`.
 */
interface IFolder {
  id: string & tags.Format<"uuid">;
  name: string;
  children: IFolder[];
}

interface ITreeView {
  total: number;
  items: IFolder[];
}

export const test_realize_operation_template_object_response_recursive_array =
  (): void => {
    const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
      typia.json.schemas<[IFolder, ITreeView]>().components.schemas as Record<
        string,
        AutoBeOpenApi.IJsonSchemaDescriptive
      >;

    const operation: AutoBeOpenApi.IOperation = createMockOperation({
      method: "get",
      path: "/tree",
      responseBody: { typeName: "ITreeView" },
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
      export async function getTest(): Promise<ITreeView> {
        return {
          total: ...,
          items: await FolderTransformer.transformAll(...),
        };
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
