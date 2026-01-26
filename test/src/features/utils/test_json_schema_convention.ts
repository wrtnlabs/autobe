import { AutoBeJsonSchemaNamingConvention } from "@autobe/agent/src/orchestrate/interface/utils/AutoBeJsonSchemaNamingConvention";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

export const test_json_schema_convention = () => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {
    ShoppingOrderGoodrevert: {
      "x-autobe-specification": "test",
      type: "string",
      description: "Test description",
    },
    ShoppingOrderGoodRevert: {
      "x-autobe-specification": "test",
      type: "number",
      description: "Test description",
    },
    Reference1: {
      "x-autobe-specification": "test",
      $ref: "#/components/schemas/ShoppingOrderGoodRevert",
      description: "Test description",
    },
    Reference2: {
      "x-autobe-specification": "test",
      $ref: "#/components/schemas/ShoppingOrderGoodrevert",
      description: "Test description",
    },
  };
  AutoBeJsonSchemaNamingConvention.normalize({
    operations: [],
    components: {
      authorizations: [],
      schemas,
    },
  });
  TestValidator.equals("convention", schemas, {
    ShoppingOrderGoodRevert: {
      "x-autobe-specification": "test",
      type: "string",
      description: "Test description",
    },
    Reference1: {
      "x-autobe-specification": "test",
      $ref: "#/components/schemas/ShoppingOrderGoodRevert",
      description: "Test description",
    },
    Reference2: {
      "x-autobe-specification": "test",
      $ref: "#/components/schemas/ShoppingOrderGoodRevert",
      description: "Test description",
    },
  } satisfies Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>);
};
