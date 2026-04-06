import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createTestModel } from "./internal/createTestModel";

/**
 * A DTO with a 1:N self-reference (children array) but no parent property.
 * writeTemplate must produce the children-only recursive skeleton with
 * createChildrenCache, selecting id for the cache key and suppressing
 * children.
 */
interface IFolder {
  id: string & tags.Format<"uuid">;
  name: string;
  children: IFolder[];
}

export const test_realize_transformer_template_children_only = (): void => {
  const raw = typia.json.schemas<[IFolder]>().components;
  const schemas = raw.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;
  const schema = schemas[
    "IFolder"
  ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;

  const model = createTestModel({
    name: "folders",
    plainFields: [{ name: "name" }],
    foreignFields: [
      {
        name: "parent_id",
        nullable: true,
        relation: {
          name: "parentFolder",
          targetModel: "folders",
          oppositeName: "children",
        },
      },
    ],
  });

  const result = AutoBeRealizeTransformerProgrammer.writeTemplate({
    plan: {
      type: "transformer",
      dtoTypeName: "IFolder",
      thinking: "test",
      databaseSchemaName: "folders",
    },
    schema,
    schemas,
    model,
  });

  const expectedBody: string = StringUtil.trim`
      export namespace FolderTransformer {
        export type Payload = Prisma.foldersGetPayload<ReturnType<typeof select>>;

        export function select() {
          // implicit return type for better type inference
          return {
            select: {
              id: true,
              name: true,
              parent_id: true,
              children: undefined, // DO NOT select recursive relation
            },
          } satisfies Prisma.foldersFindManyArgs;
        }

        export async function transform(
          input: Payload,
          cache: VariadicSingleton<Promise<IFolder[]>, [string]> = createChildrenCache(),
        ): Promise<IFolder> {
          return {
            id: {string},
            name: {string},
            children: await cache.get(input.id),
          };
        }

        export async function transformAll(
          inputs: Payload[],
        ): Promise<IFolder[]> {
          const cache = createChildrenCache();
          return await ArrayUtil.asyncMap(inputs, (x) => transform(x, cache));
        }

        function createChildrenCache() {
          const cache = new VariadicSingleton(
            async (parentId: string): Promise<IFolder[]> => {
              const records =
                await MyGlobal.prisma.folders.findMany({
                  ...select(),
                  where: { parent_id: parentId },
                });
              return await ArrayUtil.asyncMap(records, (r) => transform(r, cache));
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
