import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createTestModel } from "./internal/createTestModel";

/**
 * When all DTO properties are scalar, select() should list each as `true` with
 * no `...` placeholder needed.
 */
interface ISimple {
  id: string & tags.Format<"uuid">;
  title: string;
  created_at: string & tags.Format<"date-time">;
}

export const test_realize_transformer_template_plain = (): void => {
  const raw = typia.json.schemas<[ISimple]>().components;
  const schemas = raw.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;
  const schema = schemas[
    "ISimple"
  ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;

  const model = createTestModel({
    name: "simples",
    plainFields: [{ name: "title" }, { name: "created_at", type: "datetime" }],
  });

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
    model,
  });

  const expectedBody: string = StringUtil.trim`
      export namespace SimpleTransformer {
        export type Payload = Prisma.simplesGetPayload<ReturnType<typeof select>>;

        export function select() {
          // implicit return type for better type inference
          return {
            select: {
              id: true,
              title: true,
              created_at: true,
            },
          } satisfies Prisma.simplesFindManyArgs;
        }

        export async function transform(input: Payload): Promise<ISimple> {
          return {
            id: {string},
            title: {string},
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
    "full body (no neighbors)",
    normalize(result).includes(normalize(expectedBody)),
    true,
  );
};
