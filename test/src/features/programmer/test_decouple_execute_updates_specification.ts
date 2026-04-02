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

export const test_decouple_execute_updates_specification = () => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
    typia.json.schemas<[ICartItem, ICart]>().components
      .schemas as unknown as Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive
    >;
  (schemas["ICartItem"] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject)[
    "x-autobe-specification"
  ] = "Fetch by joining cart_items with carts table using cart_id";

  const removal: AutoBeInterfaceSchemaDecoupleRemoval = {
    reason: "Back-reference removed",
    typeName: "ICartItem",
    propertyName: "cart",
    description: null,
    specification: "Fetch by selecting from cart_items table",
  };

  AutoBeInterfaceSchemaDecoupleProgrammer.execute({ schemas, removal });

  const item: AutoBeOpenApi.IJsonSchemaDescriptive.IObject = schemas[
    "ICartItem"
  ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
  TestValidator.equals(
    "specification",
    item["x-autobe-specification"],
    "Fetch by selecting from cart_items table",
  );
};
