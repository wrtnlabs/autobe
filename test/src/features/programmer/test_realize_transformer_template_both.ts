import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createTestModel } from "./internal/createTestModel";

/**
 * A DTO with both a nullable N:1 self-reference (parent) and a 1:N
 * self-reference (children) — the bidirectional tree node. writeTemplate must
 * produce the full bidirectional skeleton with createParentCache,
 * createChildrenCache, mutually-referencing transformAll, and
 * createChildrenCache calling createParentCache() once per batch.
 */
interface INode {
  id: string & tags.Format<"uuid">;
  name: string;
  parent: INode | null;
  children: INode[];
}

export const test_realize_transformer_template_both = (): void => {
  const raw = typia.json.schemas<[INode]>().components;
  const schemas = raw.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;
  const schema = schemas[
    "INode"
  ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;

  const model = createTestModel({
    name: "nodes",
    plainFields: [{ name: "name" }],
    foreignFields: [
      {
        name: "parent_id",
        nullable: true,
        relation: {
          name: "parent",
          targetModel: "nodes",
          oppositeName: "children",
        },
      },
    ],
  });

  const result = AutoBeRealizeTransformerProgrammer.writeTemplate({
    plan: {
      type: "transformer",
      dtoTypeName: "INode",
      thinking: "test",
      databaseSchemaName: "nodes",
    },
    schema,
    schemas,
    model,
  });

  const expectedBody: string = StringUtil.trim`
    export namespace NodeTransformer {
      export type Payload = Prisma.nodesGetPayload<ReturnType<typeof select>>;

      export function select() {
        // implicit return type for better type inference
        return {
          select: {
            id: true,
            name: true,
            parent_id: true,
            parent: undefined, // DO NOT select recursive relation
            children: undefined, // DO NOT select recursive relation
          },
        } satisfies Prisma.nodesFindManyArgs;
      }

      export async function transform(
        input: Payload,
        parentCache: VariadicSingleton<Promise<INode>, [string]> = createParentCache(),
        childrenCache: VariadicSingleton<Promise<INode[]>, [string]> = createChildrenCache(),
      ): Promise<INode> {
        return {
          id: {string},
          name: {string},
          parent: input.parent_id ? await parentCache.get(input.parent_id) : null,
          children: await childrenCache.get(input.id),
        };
      }

      export async function transformAll(
        inputs: Payload[],
      ): Promise<INode[]> {
        // Create mutually-referencing caches so the entire tree shares
        // one deduplication scope across both parent and children lookups.
        // Use definite assignment assertions (!) so TypeScript does not
        // flag the cross-references as "used before assigned" — the async
        // callbacks only execute after both variables are fully initialized.
        let parentCache!: VariadicSingleton<Promise<INode>, [string]>;
        let childrenCache!: VariadicSingleton<Promise<INode[]>, [string]>;
        parentCache = new VariadicSingleton(
          async (id: string): Promise<INode> => {
            const record =
              await MyGlobal.prisma.nodes.findFirstOrThrow({
                ...select(),
                where: { id },
              });
            return transform(record, parentCache, childrenCache);
          },
        );
        childrenCache = new VariadicSingleton(
          async (parentId: string): Promise<INode[]> => {
            const records =
              await MyGlobal.prisma.nodes.findMany({
                ...select(),
                where: { parent_id: parentId },
              });
            return await ArrayUtil.asyncMap(records, (r) =>
              transform(r, parentCache, childrenCache),
            );
          },
        );
        return await ArrayUtil.asyncMap(inputs, (x) =>
          transform(x, parentCache, childrenCache),
        );
      }

      function createParentCache() {
        const cache = new VariadicSingleton(
          async (id: string): Promise<INode> => {
            const record =
              await MyGlobal.prisma.nodes.findFirstOrThrow({
                ...select(),
                where: { id },
              });
            return transform(record, cache);
          },
        );
        return cache;
      }

      function createChildrenCache() {
        const cache = new VariadicSingleton(
          async (parentId: string): Promise<INode[]> => {
            const records =
              await MyGlobal.prisma.nodes.findMany({
                ...select(),
                where: { parent_id: parentId },
              });
            // createParentCache() is called once per batch so all siblings
            // in the same children list share one parent-deduplication scope.
            const parentCache = createParentCache();
            return await ArrayUtil.asyncMap(records, (r) =>
              transform(r, parentCache, cache),
            );
          },
        );
        return cache;
      }
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
