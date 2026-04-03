import { AutoBeInterfaceSchemaDecoupleProgrammer } from "@autobe/agent/src/orchestrate/interface/programmers/AutoBeInterfaceSchemaDecoupleProgrammer";
import {
  AutoBeInterfaceSchemaDecoupleCycle,
  AutoBeInterfaceSchemaDecoupleRemoval,
  AutoBeOpenApi,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia, { IValidation } from "typia";

interface ICartItem {
  cart: ICart;
  name: string;
}
interface ICart {
  items: ICartItem[];
}

export const test_interface_schema_decouple_validate_not_a_cycle_edge = () => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[ICartItem, ICart]>().components
      .schemas as unknown as Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive
    >;

  const cycle: AutoBeInterfaceSchemaDecoupleCycle = {
    types: ["ICart", "ICartItem"],
    edges: [
      { sourceType: "ICartItem", propertyName: "cart", targetType: "ICart" },
    ],
  };

  // `name` is a valid property of ICartItem but is NOT a cycle edge
  const removal: AutoBeInterfaceSchemaDecoupleRemoval = {
    reason: "Trying to remove a non-cycle property",
    typeName: "ICartItem",
    propertyName: "name",
    description: null,
    specification: null,
  };

  const errors: IValidation.IError[] = [];
  AutoBeInterfaceSchemaDecoupleProgrammer.validate({
    schemas,
    cycle,
    removal,
    errors,
    path: "$input",
  });

  TestValidator.equals("errors", errors, [
    {
      path: "$input.removal",
      expected: "a removal that matches a cycle edge (sourceType.propertyName)",
      value: "ICartItem.name",
    },
  ]);
};
