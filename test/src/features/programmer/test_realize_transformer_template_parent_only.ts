import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createTestModel } from "./internal/createTestModel";

/**
 * A DTO with a nullable N:1 self-reference (parent). writeTemplate must produce
 * the parent-only recursive skeleton with createParentCache and transformAll,
 * selecting the FK column and suppressing the parent relation.
 */
interface ICategory {
  id: string & tags.Format<"uuid">;
  name: string;
  parent: ICategory | null;
}

export const test_realize_transformer_template_parent_only = (): void => {
  const raw = typia.json.schemas<[ICategory]>().components;
  const schemas = raw.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;
  const schema = schemas[
    "ICategory"
  ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;

  const model = createTestModel({
    name: "categories",
    plainFields: [{ name: "name" }],
    foreignFields: [
      {
        name: "parent_id",
        nullable: true,
        relation: {
          name: "parent",
          targetModel: "categories",
          oppositeName: "children",
        },
      },
    ],
  });

  const result = AutoBeRealizeTransformerProgrammer.writeTemplate({
    plan: {
      type: "transformer",
      dtoTypeName: "ICategory",
      thinking: "test",
      databaseSchemaName: "categories",
    },
    schema,
    schemas,
    model,
  });

  const expectedBody: string = StringUtil.trim`
    export namespace CategoryTransformer {
      export type Payload = Prisma.categoriesGetPayload<ReturnType<typeof select>>;

      export function select() {
        // implicit return type for better type inference
        return {
          select: {
            id: true,
            name: true,
            parent_id: true,
            parent: undefined, // DO NOT select recursive relation
          },
        } satisfies Prisma.categoriesFindManyArgs;
      }

      export async function transform(
        input: Payload,
        cache: VariadicSingleton<Promise<ICategory>, [string]> = createParentCache(),
      ): Promise<ICategory> {
        return {
          id: {string},
          name: {string},
          parent: input.parent_id ? await cache.get(input.parent_id) : null,
        };
      }

      export async function transformAll(
        inputs: Payload[],
      ): Promise<ICategory[]> {
        const cache = createParentCache();
        return await ArrayUtil.asyncMap(inputs, (x) => transform(x, cache));
      }

      function createParentCache() {
        const cache = new VariadicSingleton(
          async (id: string): Promise<ICategory> => {
            const record =
              await MyGlobal.prisma.categories.findFirstOrThrow({
                ...select(),
                where: { id },
              });
            return transform(record, cache);
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
