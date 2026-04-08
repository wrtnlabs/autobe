import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createTestModel } from "./internal/createTestModel";

/**
 * When a neighbor relation is a nullable array (`IComment[] | null`), the
 * template must wrap the `ArrayUtil.asyncMap` call with a null check:
 *
 *     input.x ? await ArrayUtil.asyncMap(input.x, T.transform) : null;
 *
 * NOT the bare:
 *
 *     await ArrayUtil.asyncMap(input.x, T.transform);
 *
 * Which would throw at runtime when `input.x` is null.
 */
interface IPost {
  id: string & tags.Format<"uuid">;
  title: string;
  comments: IComment[] | null;
}

interface IComment {
  id: string & tags.Format<"uuid">;
  body: string;
}

export const test_realize_transformer_template_nullable_array_neighbor =
  (): void => {
    const raw = typia.json.schemas<[IPost]>().components;
    const schemas = raw.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;
    const schema = schemas[
      "IPost"
    ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;

    const model = createTestModel({
      name: "posts",
      plainFields: [{ name: "title" }],
    });

    const result = AutoBeRealizeTransformerProgrammer.writeTemplate({
      plan: {
        type: "transformer",
        dtoTypeName: "IPost",
        thinking: "test",
        databaseSchemaName: "posts",
      },
      schema,
      schemas,
      model,
      neighbors: [
        {
          type: "transformer",
          dtoTypeName: "IComment",
          thinking: "test",
          databaseSchemaName: "comments",
        },
      ],
      relations: [
        {
          propertyKey: "postComments",
          targetModel: "comments",
          relationType: "hasMany",
          fkColumns: "-",
        },
      ],
    });

    const expectedBody: string = StringUtil.trim`
      export namespace PostTransformer {
        export type Payload = Prisma.postsGetPayload<ReturnType<typeof select>>;

        export function select() {
          // implicit return type for better type inference
          return {
            select: {
              id: true,
              title: true,
              postComments: CommentTransformer.select(),
            },
          } satisfies Prisma.postsFindManyArgs;
        }

        export async function transform(input: Payload): Promise<IPost> {
          return {
            id: {string},
            title: {string},
            comments: input.postComments ? await ArrayUtil.asyncMap(input.postComments, CommentTransformer.transform) : null,
          };
        }
      }
    `;

    const normalize = (s: string): string =>
      s
        .split("\n")
        .map((l) => l.trimStart())
        .join("\n");
    TestValidator.equals(
      "nullable array neighbor: null check wraps asyncMap",
      normalize(result).includes(normalize(expectedBody)),
      true,
    );
  };
