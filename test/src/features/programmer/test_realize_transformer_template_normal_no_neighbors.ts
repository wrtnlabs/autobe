import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

/**
 * When neighbors and relations are provided but empty, or when a DTO has no
 * neighbor-matching properties, the template must fall back to the original
 * skeleton — no `select: { }` wrapper, properties all `...,`.
 */
interface ISimple {
  id: string & tags.Format<"uuid">;
  title: string;
  created_at: string & tags.Format<"date-time">;
}

export const test_realize_transformer_template_normal_no_neighbors =
  (): void => {
    const raw = typia.json.schemas<[ISimple]>().components;
    const schemas = raw.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;
    const schema = schemas[
      "ISimple"
    ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;

    const result = AutoBeRealizeTransformerProgrammer.writeTemplate({
      plan: {
        type: "transformer",
        dtoTypeName: "ISimple",
        thinking: "test",
        databaseSchemaName: "simples",
      },
      schema,
      schemas,
      neighbors: [],
      relations: [],
    });

    const expectedBody: string = StringUtil.trim`
      export namespace SimpleTransformer {
        export type Payload = Prisma.simplesGetPayload<ReturnType<typeof select>>;

        export function select() {
          // implicit return type for better type inference
          return {
            ...
          } satisfies Prisma.simplesFindManyArgs;
        }

        export async function transform(input: Payload): Promise<ISimple> {
          return {
            id: ...,
            title: ...,
            created_at: ...,
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
      "full body (no neighbors)",
      normalize(result).includes(normalize(expectedBody)),
      true,
    );
  };
