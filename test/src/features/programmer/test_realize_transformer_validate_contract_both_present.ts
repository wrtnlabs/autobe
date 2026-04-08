import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { IValidation, tags } from "typia";

import { createTestModel } from "./internal/createTestModel";

/**
 * When code properly uses both `ItemTransformer.select()` and
 * `ItemTransformer.transform()`, the validator must NOT emit a select-transform
 * contract error.
 */
interface IOrder {
  id: string & tags.Format<"uuid">;
  items: IItem[];
}
interface IItem {
  id: string & tags.Format<"uuid">;
  name: string;
}

export const test_realize_transformer_validate_contract_both_present =
  (): void => {
    const raw = typia.json.schemas<[IOrder, IItem]>().components;
    const schemas = raw.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;

    const model = createTestModel({ name: "orders" });

    const code: string = [
      "export namespace OrderTransformer {",
      "  export function select() {",
      "    return {",
      "      select: {",
      "        id: true,",
      "        items: ItemTransformer.select(),",
      "      },",
      "    } satisfies Prisma.ordersFindManyArgs;",
      "  }",
      "  export async function transform(input: any): Promise<IOrder> {",
      "    return {",
      "      id: input.id,",
      "      items: await Promise.all(input.items.map(ItemTransformer.transform)),",
      "    };",
      "  }",
      "}",
    ].join("\n");

    const errors: IValidation.IError[] =
      AutoBeRealizeTransformerProgrammer.validate({
        application: { files: [{ name: "test", models: [model] }] } as any,
        document: { components: { schemas } } as AutoBeOpenApi.IDocument,
        plan: {
          type: "transformer",
          dtoTypeName: "IOrder",
          thinking: "test",
          databaseSchemaName: "orders",
        },
        neighbors: [
          {
            type: "transformer",
            dtoTypeName: "IItem",
            thinking: "test",
            databaseSchemaName: "items",
          },
        ],
        transformMappings: [
          { property: "id", how: "direct" },
          { property: "items", how: "neighbor transform" },
        ],
        selectMappings: [
          { member: "id", kind: "scalar", nullable: false, how: "direct" },
        ],
        draft: code,
        revise: { review: "", final: null },
      });

    const contractErrors = errors.filter(
      (e) =>
        e.expected?.includes(".select() must appear") ||
        e.expected?.includes(".transform() must be called"),
    );

    TestValidator.equals(
      "should have 0 contract errors",
      contractErrors.length,
      0,
    );
  };
