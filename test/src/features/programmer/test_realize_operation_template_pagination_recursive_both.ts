import { writeRealizeOperationTemplate } from "@autobe/agent/src/orchestrate/realize/programmers/internal/writeRealizeOperationTemplate";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createMockOperation } from "./internal/createMockOperation";
import { createMockScenario } from "./internal/createMockScenario";
import { createMockTransformer } from "./internal/createMockTransformer";

/**
 * A DTO with both a nullable N:1 self-reference (parent) and a 1:N
 * self-reference (children) — the bidirectional tree node.
 * The pagination operation template must use transformAll() rather than
 * ArrayUtil.asyncMap() because the DTO is recursive in both directions.
 */
interface INode {
  id: string & tags.Format<"uuid">;
  name: string;
  parent: INode | null;
  children: INode[];
}

export const test_realize_operation_template_pagination_recursive_both =
  (): void => {
    const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
      typia.json.schemas<[INode]>().components.schemas as Record<
        string,
        AutoBeOpenApi.IJsonSchemaDescriptive
      >;

    const operation: AutoBeOpenApi.IOperation = createMockOperation({
      method: "get",
      path: "/nodes",
      responseBody: { typeName: "IPageINode" },
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
          dtoTypeName: "INode",
          databaseSchemaName: "nodes",
        }),
      ],
    });

    const expectedBody: string = StringUtil.trim`
      export async function getTest(): Promise<IPageINode> {
        const records = await MyGlobal.prisma.nodes.findMany({
          ...NodeTransformer.select(),
          ...,
        });
        return {
          pagination: {
            current: ...,
            limit: ...,
            records: ...,
            pages: ...,
          },
          data: await NodeTransformer.transformAll(records),
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
