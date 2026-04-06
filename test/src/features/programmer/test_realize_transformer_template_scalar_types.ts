import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

/**
 * Exercises every scalar branch of `isScalarProperty()`:
 *
 * - `string` (already covered by other tests, included for completeness)
 * - `number`
 * - `integer` (via tags.Type<"int32">)
 * - `boolean`
 * - `string | null` (oneOf where every member is null or scalar)
 * - `number | null`
 *
 * All properties are scalar, so select() must list every key as `true` with no
 * `...` placeholder.
 */
interface IProduct {
  id: string & tags.Format<"uuid">;
  name: string;
  price: number;
  quantity: number & tags.Type<"int32">;
  is_active: boolean;
  description: string | null;
  rating: number | null;
}

export const test_realize_transformer_template_scalar_types = (): void => {
  const raw = typia.json.schemas<[IProduct]>().components;
  const schemas = raw.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;
  const schema = schemas[
    "IProduct"
  ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;

  const result: string = AutoBeRealizeTransformerProgrammer.writeTemplate({
    plan: {
      type: "transformer",
      dtoTypeName: "IProduct",
      thinking: "test",
      databaseSchemaName: "products",
    },
    schema,
    schemas,
    neighbors: [],
    relations: [],
  });

  // All properties are scalar → select has no `...`
  const expectedBody: string = StringUtil.trim`
    export namespace ProductTransformer {
      export type Payload = Prisma.productsGetPayload<ReturnType<typeof select>>;

      export function select() {
        // implicit return type for better type inference
        return {
          select: {
            id: true,
            name: true,
            price: true,
            quantity: true,
            is_active: true,
            description: true,
            rating: true,
          },
        } satisfies Prisma.productsFindManyArgs;
      }

      export async function transform(input: Payload): Promise<IProduct> {
        return {
          id: {string},
          name: {string},
          price: {number},
          quantity: {integer},
          is_active: {boolean},
          description: {null | string},
          rating: {null | number},
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
    "scalar types coverage",
    normalize(result).includes(normalize(expectedBody)),
    true,
  );
};
