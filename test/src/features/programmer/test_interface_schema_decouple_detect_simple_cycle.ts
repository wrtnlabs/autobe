import { AutoBeInterfaceSchemaDecoupleProgrammer } from "@autobe/agent/src/orchestrate/interface/programmers/AutoBeInterfaceSchemaDecoupleProgrammer";
import {
  AutoBeInterfaceSchemaDecoupleCycle,
  AutoBeOpenApi,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

interface IOrder {
  parent?: IOrder | null | undefined;
  items?: IOrderItem[] | null | undefined;
}
interface IOrderItem {
  order?: IOrder | null | undefined;
}

export const test_interface_schema_decouple_detect_simple_cycle = () => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchema> = typia.json.schemas<
    [IOrder, IOrderItem]
  >().components.schemas as Record<string, AutoBeOpenApi.IJsonSchema>;

  const cycles: AutoBeInterfaceSchemaDecoupleCycle[] =
    AutoBeInterfaceSchemaDecoupleProgrammer.detectCycles(schemas);
  TestValidator.equals("one cycle detected", 1, cycles.length);

  const top: AutoBeInterfaceSchemaDecoupleCycle = cycles[0]!;
  TestValidator.equals("types", top.types.slice().sort(), [
    "IOrder",
    "IOrderItem",
  ]);
  TestValidator.equals(
    "edges",
    top.edges.slice().sort((a, b) => a.sourceType.localeCompare(b.sourceType)),
    [
      {
        sourceType: "IOrder",
        propertyName: "items",
        targetType: "IOrderItem",
      },
      {
        sourceType: "IOrderItem",
        propertyName: "order",
        targetType: "IOrder",
      },
    ],
  );
};
