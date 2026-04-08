import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

import { createTestModel } from "./internal/createTestModel";

/**
 * When a DTO property is a $ref (single, array, or nullable) but no
 * corresponding transformer exists in the neighbors list, the template must
 * emit `{TypeName}` / `{Array<TypeName>}` / `{TypeName | null}` hints instead
 * of a transformer call — never a bare `...`.
 */
interface IMember {
  id: string & tags.Format<"uuid">;
  name: string;
  department: IDepartment;
  tags: ITag[];
  category: ICategory | null;
}

interface IDepartment {
  id: string & tags.Format<"uuid">;
  name: string;
}

interface ITag {
  id: string & tags.Format<"uuid">;
  label: string;
}

interface ICategory {
  id: string & tags.Format<"uuid">;
  name: string;
}

export const test_realize_transformer_template_non_neighbor_ref = (): void => {
  const raw = typia.json.schemas<[IMember]>().components;
  const schemas = raw.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;
  const schema = schemas[
    "IMember"
  ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;

  const model = createTestModel({
    name: "members",
    plainFields: [{ name: "name" }],
  });

  // No neighbors / no relations → all properties fall back to type hints
  const result: string = AutoBeRealizeTransformerProgrammer.writeTemplate({
    plan: {
      type: "transformer",
      dtoTypeName: "IMember",
      thinking: "test",
      databaseSchemaName: "members",
    },
    schema,
    schemas,
    model,
    neighbors: [],
    relations: [],
  });

  const expectedBody: string = StringUtil.trim`
    export namespace MemberTransformer {
      export type Payload = Prisma.membersGetPayload<ReturnType<typeof select>>;

      export function select() {
        // implicit return type for better type inference
        return {
          select: {
            id: true,
            name: true,
            ...
          },
        } satisfies Prisma.membersFindManyArgs;
      }

      export async function transform(input: Payload): Promise<IMember> {
        return {
          id: {string},
          name: {string},
          department: {IDepartment},
          tags: {Array<ITag>},
          category: {null | ICategory},
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
    "non-neighbor ref type hints",
    normalize(result).includes(normalize(expectedBody)),
    true,
  );
};
