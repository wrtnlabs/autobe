import { AutoBeRealizeTransformerProgrammer } from "@autobe/agent/src/orchestrate/realize/programmers/AutoBeRealizeTransformerProgrammer";
import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { TestValidator } from "@nestia/e2e";
import typia, { tags } from "typia";

/**
 * A DTO that mixes all three property categories in one template:
 *
 * - Scalar: `id`, `title`, `created_at` → select `true`, transform `{type}`
 * - Neighbor $ref: `customer` (single), `items` (array) → select `.select()`,
 *   transform call
 * - Non-neighbor $ref: `coupon` (no transformer) → select `...`, transform
 *   `{ICoupon}`
 *
 * This verifies that `buildSelectEntries` and `writeNormalTemplate` interleave
 * all three categories correctly within a single template.
 */
interface IOrder {
  id: string & tags.Format<"uuid">;
  title: string;
  customer: ICustomer;
  coupon: ICoupon;
  items: IOrderItem[];
  created_at: string & tags.Format<"date-time">;
}

interface ICustomer {
  id: string & tags.Format<"uuid">;
  name: string;
}

interface ICoupon {
  id: string & tags.Format<"uuid">;
  code: string;
}

interface IOrderItem {
  id: string & tags.Format<"uuid">;
  quantity: number;
}

export const test_realize_transformer_template_mixed = (): void => {
  const raw = typia.json.schemas<[IOrder]>().components;
  const schemas = raw.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;
  const schema = schemas[
    "IOrder"
  ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;

  const result: string = AutoBeRealizeTransformerProgrammer.writeTemplate({
    plan: {
      type: "transformer",
      dtoTypeName: "IOrder",
      thinking: "test",
      databaseSchemaName: "orders",
    },
    schema,
    schemas,
    // Only ICustomer and IOrderItem have transformers; ICoupon does NOT.
    neighbors: [
      {
        type: "transformer",
        dtoTypeName: "ICustomer",
        thinking: "test",
        databaseSchemaName: "customers",
      },
      {
        type: "transformer",
        dtoTypeName: "IOrderItem",
        thinking: "test",
        databaseSchemaName: "order_items",
      },
    ],
    relations: [
      {
        propertyKey: "buyer",
        targetModel: "customers",
        relationType: "belongsTo",
        fkColumns: "customer_id",
      },
      {
        propertyKey: "orderItems",
        targetModel: "order_items",
        relationType: "hasMany",
        fkColumns: "-",
      },
    ],
  });

  const expectedBody: string = StringUtil.trim`
    export namespace OrderTransformer {
      export type Payload = Prisma.ordersGetPayload<ReturnType<typeof select>>;

      export function select() {
        // implicit return type for better type inference
        return {
          select: {
            id: true,
            title: true,
            buyer: CustomerTransformer.select(),
            orderItems: OrderItemTransformer.select(),
            created_at: true,
            ...
          },
        } satisfies Prisma.ordersFindManyArgs;
      }

      export async function transform(input: Payload): Promise<IOrder> {
        return {
          id: {string},
          title: {string},
          customer: await CustomerTransformer.transform(input.buyer),
          coupon: {ICoupon},
          items: await ArrayUtil.asyncMap(input.orderItems, OrderItemTransformer.transform),
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
    "mixed: scalar + neighbor + non-neighbor ref",
    normalize(result).includes(normalize(expectedBody)),
    true,
  );
};
