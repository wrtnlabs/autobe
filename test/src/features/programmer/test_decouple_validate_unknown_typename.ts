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
}
interface ICart {
  items: ICartItem[];
}

export const test_decouple_validate_unknown_typename = () => {
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

  const removal: AutoBeInterfaceSchemaDecoupleRemoval = {
    reason: "Hallucinated type name",
    typeName: "INonExistent",
    propertyName: "cart",
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
      path: "$input.removal.typeName",
      expected: "one of the existing schema type names",
      value: "INonExistent",
    },
  ]);
};
