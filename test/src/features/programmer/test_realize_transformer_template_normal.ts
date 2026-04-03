import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

/**
 * A plain DTO with no self-referencing properties. writeTemplate must produce
 * the normal (non-recursive) skeleton with no transformAll, no cache functions.
 */
interface IArticle {
  id: string & tags.Format<"uuid">;
  title: string;
  body: string;
  created_at: string & tags.Format<"date-time">;
}

export const test_realize_transformer_template_normal = (): void => {
  const raw = typia.json.schemas<[IArticle]>().components;
  const schema = raw.schemas![
    "IArticle"
  ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;

  const result = AutoBeRealizeTransformerProgrammer.writeTemplate({
    plan: {
      type: "transformer",
      dtoTypeName: "IArticle",
      thinking: "test",
      databaseSchemaName: "articles",
    },
    schema,
    schemas: raw.schemas as Record<string, AutoBeOpenApi.IJsonSchema>,
  });

  const expectedBody: string = StringUtil.trim`
    export namespace ArticleTransformer {
      export type Payload = Prisma.articlesGetPayload<ReturnType<typeof select>>;

      export function select() {
        // implicit return type for better type inference
        return {
          ...
        } satisfies Prisma.articlesFindManyArgs;
      }

      export async function transform(input: Payload): Promise<IArticle> {
        return {
          id: ...,
          title: ...,
          body: ...,
          created_at: ...,
        };
      }
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
