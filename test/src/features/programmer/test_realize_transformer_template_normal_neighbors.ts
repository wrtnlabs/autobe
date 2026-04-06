import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createTestModel } from "./internal/createTestModel";

/**
 * A DTO with three kinds of neighbor relations:
 *
 * - `writer` (belongsTo via `IWriter`)
 * - `comments` (hasMany via `IComment[]`)
 * - `category` (nullable belongsTo via `ICategory | null`)
 *
 * The relation property keys intentionally differ from the DTO property names
 * (`author` ≠ `writer`, `articleComments` ≠ `comments`, `category` ≠
 * `category`) to verify that select() uses relation keys while transform() uses
 * DTO keys.
 */
interface IArticle {
  id: string & tags.Format<"uuid">;
  title: string;
  writer: IWriter;
  comments: IComment[];
  category: ICategory | null;
  created_at: string & tags.Format<"date-time">;
}

interface IWriter {
  id: string & tags.Format<"uuid">;
  name: string;
}

interface IComment {
  id: string & tags.Format<"uuid">;
  body: string;
}

interface ICategory {
  id: string & tags.Format<"uuid">;
  name: string;
}

export const test_realize_transformer_template_normal_neighbors = (): void => {
  const raw = typia.json.schemas<[IArticle]>().components;
  const schemas = raw.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;
  const schema = schemas[
    "IArticle"
  ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;

  const model = createTestModel({
    name: "articles",
    plainFields: [{ name: "title" }, { name: "created_at", type: "datetime" }],
    foreignFields: [
      {
        name: "writer_id",
        relation: {
          name: "author",
          targetModel: "writers",
          oppositeName: "articles",
        },
      },
      {
        name: "category_id",
        nullable: true,
        relation: {
          name: "category",
          targetModel: "categories",
          oppositeName: "articles",
        },
      },
    ],
  });

  const result = AutoBeRealizeTransformerProgrammer.writeTemplate({
    plan: {
      type: "transformer",
      dtoTypeName: "IArticle",
      thinking: "test",
      databaseSchemaName: "articles",
    },
    schema,
    schemas,
    model,
    neighbors: [
      {
        type: "transformer",
        dtoTypeName: "IWriter",
        thinking: "test",
        databaseSchemaName: "writers",
      },
      {
        type: "transformer",
        dtoTypeName: "IComment",
        thinking: "test",
        databaseSchemaName: "comments",
      },
      {
        type: "transformer",
        dtoTypeName: "ICategory",
        thinking: "test",
        databaseSchemaName: "categories",
      },
    ],
    relations: [
      {
        propertyKey: "author",
        targetModel: "writers",
        relationType: "belongsTo",
        fkColumns: "writer_id",
      },
      {
        propertyKey: "articleComments",
        targetModel: "comments",
        relationType: "hasMany",
        fkColumns: "-",
      },
      {
        propertyKey: "category",
        targetModel: "categories",
        relationType: "belongsTo",
        fkColumns: "category_id",
      },
    ],
  });

  const expectedBody: string = StringUtil.trim`
    export namespace ArticleTransformer {
      export type Payload = Prisma.articlesGetPayload<ReturnType<typeof select>>;

      export function select() {
        // implicit return type for better type inference
        return {
          select: {
            id: true,
            title: true,
            created_at: true,
            author: WriterTransformer.select(),
            category: CategoryTransformer.select(),
            articleComments: CommentTransformer.select(),
          },
        } satisfies Prisma.articlesFindManyArgs;
      }

      export async function transform(input: Payload): Promise<IArticle> {
        return {
          id: {string},
          title: {string},
          writer: await WriterTransformer.transform(input.author),
          comments: await ArrayUtil.asyncMap(input.articleComments, CommentTransformer.transform),
          category: input.category ? await CategoryTransformer.transform(input.category) : null,
          created_at: {string},
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
    "full body",
    normalize(result).includes(normalize(expectedBody)),
    true,
  );
};
