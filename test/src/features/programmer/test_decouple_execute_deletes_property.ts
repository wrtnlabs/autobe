import { AutoBeInterfaceSchemaDecoupleProgrammer } from "@autobe/agent/src/orchestrate/interface/programmers/AutoBeInterfaceSchemaDecoupleProgrammer";
import {
  AutoBeInterfaceSchemaDecoupleRemoval,
  AutoBeOpenApi,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

interface ICartItem {
  cart: ICart;
  name: string;
}
interface ICart {
  items: ICartItem[];
}

export const test_decouple_execute_deletes_property = () => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[ICartItem, ICart]>().components
      .schemas as unknown as Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive
    >;

  const removal: AutoBeInterfaceSchemaDecoupleRemoval = {
    reason: "Back-reference to parent cart is redundant",
    typeName: "ICartItem",
    propertyName: "cart",
    description: null,
    specification: null,
  };

  AutoBeInterfaceSchemaDecoupleProgrammer.execute({ schemas, removal });

  const item: AutoBeOpenApi.IJsonSchemaDescriptive.IObject = schemas[
    "ICartItem"
  ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
  TestValidator.equals(
    "properties",
    Object.keys(item.properties).slice().sort(),
    ["name"],
  );
};
