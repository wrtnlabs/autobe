import { AutoBeJsonSchemaNamingConvention } from "@autobe/agent/src/orchestrate/interface/utils/AutoBeJsonSchemaNamingConvention";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

export const test_json_schema_convention = () => {
  const schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive> = {
    ShoppingOrderGoodrevert: {
      type: "string",
      description: "Test description",
    },
    ShoppingOrderGoodRevert: {
      type: "number",
      description: "Test description",
    },
    Reference1: {
      $ref: "#/components/schemas/ShoppingOrderGoodRevert",
      description: "Test description",
    },
    Reference2: {
      $ref: "#/components/schemas/ShoppingOrderGoodrevert",
      description: "Test description",
    },
  };
  AutoBeJsonSchemaNamingConvention.schemas([], schemas);
  TestValidator.equals("convention", schemas, {
    ShoppingOrderGoodRevert: {
      type: "string",
      description: "Test description",
    },
    Reference1: {
      $ref: "#/components/schemas/ShoppingOrderGoodRevert",
      description: "Test description",
    },
    Reference2: {
      $ref: "#/components/schemas/ShoppingOrderGoodRevert",
      description: "Test description",
    },
  } satisfies Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>);
};
