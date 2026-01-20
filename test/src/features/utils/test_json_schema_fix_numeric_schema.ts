import { AutoBeJsonSchemaFactory } from "@autobe/agent/src/orchestrate/interface/utils/AutoBeJsonSchemaFactory";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

export const test_json_schema_fix_numeric_schema = () => {
  // Case 1: number minimum === maximum -> const
  const case1: AutoBeOpenApi.IJsonSchema.IConstant =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "number",
      minimum: 0,
      maximum: 0,
    }) as AutoBeOpenApi.IJsonSchema.IConstant;
  TestValidator.equals("number min === max", case1, {
    const: 0,
  });

  // Case 2: integer minimum === maximum -> const
  const case2: AutoBeOpenApi.IJsonSchema.IConstant =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "integer",
      minimum: 42,
      maximum: 42,
    }) as AutoBeOpenApi.IJsonSchema.IConstant;
  TestValidator.equals("integer min === max", case2, {
    const: 42,
  });

  // Case 3: integer minimum: N, exclusiveMaximum: N+1 -> const N
  const case3: AutoBeOpenApi.IJsonSchema.IConstant =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "integer",
      minimum: 5,
      exclusiveMaximum: 6,
    }) as AutoBeOpenApi.IJsonSchema.IConstant;
  TestValidator.equals("integer min & exclusiveMax", case3, {
    const: 5,
  });

  // Case 4: integer exclusiveMinimum: N-1, maximum: N -> const N
  const case4: AutoBeOpenApi.IJsonSchema.IConstant =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "integer",
      exclusiveMinimum: 4,
      maximum: 5,
    }) as AutoBeOpenApi.IJsonSchema.IConstant;
  TestValidator.equals("integer exclusiveMin & max", case4, {
    const: 5,
  });

  // Case 5: integer exclusiveMinimum: N-1, exclusiveMaximum: N+1 -> const N
  const case5: AutoBeOpenApi.IJsonSchema.IConstant =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "integer",
      exclusiveMinimum: 4,
      exclusiveMaximum: 6,
    }) as AutoBeOpenApi.IJsonSchema.IConstant;
  TestValidator.equals("integer exclusiveMin & exclusiveMax", case5, {
    const: 5,
  });

  // Case 6: description should be preserved when converting to const
  const case6: AutoBeOpenApi.IJsonSchema.IConstant =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "integer",
      minimum: 1,
      maximum: 1,
      description: "Version number",
    } as any) as AutoBeOpenApi.IJsonSchema.IConstant;
  TestValidator.equals("description preserved", case6, {
    const: 1,
    description: "Version number",
  });
};
