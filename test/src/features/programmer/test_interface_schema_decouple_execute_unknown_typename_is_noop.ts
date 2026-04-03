import { AutoBeInterfaceSchemaDecoupleProgrammer } from "@autobe/agent/src/orchestrate/interface/programmers/AutoBeInterfaceSchemaDecoupleProgrammer";
import {
  AutoBeInterfaceSchemaDecoupleRemoval,
  AutoBeOpenApi,
} from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

interface ICartItem {
  name: string;
}

export const test_interface_schema_decouple_execute_unknown_typename_is_noop =
  () => {
    const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> =
      typia.json.schemas<[ICartItem]>().components.schemas as unknown as Record<
        string,
        AutoBeOpenApi.IJsonSchemaDescriptive
      >;

    const removal: AutoBeInterfaceSchemaDecoupleRemoval = {
      reason: "Targeting a non-existent type",
      typeName: "NonExistent",
      propertyName: "name",
      description: null,
      specification: null,
    };

    AutoBeInterfaceSchemaDecoupleProgrammer.execute({ schemas, removal });

    const item: AutoBeOpenApi.IJsonSchemaDescriptive.IObject = schemas[
      "ICartItem"
    ] as AutoBeOpenApi.IJsonSchemaDescriptive.IObject;
    TestValidator.equals("schema keys", Object.keys(schemas).slice().sort(), [
      "ICartItem",
    ]);
    TestValidator.equals(
      "properties",
      Object.keys(item.properties).slice().sort(),
      ["name"],
    );
  };
