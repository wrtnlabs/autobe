import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { IValidation, tags } from "typia";

import { createTestModel } from "./internal/createTestModel";

/**
 * Contract validation must also run on `revise.final` code, not just the draft.
 * Here the draft is clean but the revised final violates the contract.
 */
interface IOrder {
  id: string & tags.Format<"uuid">;
  items: IItem[];
}
interface IItem {
  id: string & tags.Format<"uuid">;
  name: string;
}

export const test_realize_transformer_validate_contract_final_code =
  (): void => {
    const raw = typia.json.schemas<[IOrder, IItem]>().components;
    const schemas = raw.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;

    const model = createTestModel({ name: "orders" });

    const cleanCode: string = [
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

    const brokenFinal: string = [
      "export namespace OrderTransformer {",
      "  export function select() {",
      "    return { select: { id: true } } satisfies Prisma.ordersFindManyArgs;",
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
        draft: cleanCode,
        revise: { review: "use inline items", final: brokenFinal },
      });

    const contractErrors = errors.filter(
      (e) =>
        e.expected?.includes(".select() must appear") ||
        e.expected?.includes(".transform() must be called"),
    );

    // draft is clean → 0 errors from draft
    // final has transform without select → 1 error from final
    TestValidator.equals(
      "should have 1 contract error",
      contractErrors.length,
      1,
    );
    TestValidator.equals(
      "error path points to revise.final",
      contractErrors[0]!.path,
      "$input.request.revise.final",
    );
  };
