import { AutoBeJsonSchemaFactory } from "@autobe/agent/src/orchestrate/interface/utils/AutoBeJsonSchemaFactory";
import { AutoBeOpenApi } from "@autobe/interface";
import { TestValidator } from "@nestia/e2e";

export const test_json_schema_fix_numeric_schema = () => {
  // Case 1: Minimum == Maximum -> const
  const case1: AutoBeOpenApi.IJsonSchema.IConstant =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "number",
      minimum: 0,
      maximum: 0,
    }) as AutoBeOpenApi.IJsonSchema.IConstant;
  TestValidator.equals("Minimum == Maximum", case1, {
    const: 0,
  });

  // Case 2: Minimum > Maximum -> delete both
  const case2: AutoBeOpenApi.IJsonSchema.INumber =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "number",
      minimum: 10,
      maximum: 5,
    });
  TestValidator.equals("Minimum > Maximum", case2, {
    type: "number",
  });

  // Case 3: exclusiveMinimum >= exclusiveMaximum -> delete both
  const case3: AutoBeOpenApi.IJsonSchema.INumber =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "number",
      exclusiveMinimum: 5,
      exclusiveMaximum: 5,
    });
  TestValidator.equals("exclusiveMinimum >= exclusiveMaximum", case3, {
    type: "number",
  });

  // Case 4: minimum >= exclusiveMaximum -> delete both
  const case4: AutoBeOpenApi.IJsonSchema.INumber =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "number",
      minimum: 5,
      exclusiveMaximum: 5,
    });
  TestValidator.equals("minimum >= exclusiveMaximum", case4, {
    type: "number",
  });

  // Case 5: exclusiveMinimum >= maximum -> delete both
  const case5: AutoBeOpenApi.IJsonSchema.INumber =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "number",
      exclusiveMinimum: 5,
      maximum: 5,
    });
  TestValidator.equals("exclusiveMinimum >= maximum", case5, {
    type: "number",
  });

  // Case 6: min === max with conflicting exclusive -> delete all
  // exclusiveMinimum: 5 means value > 5, but minimum: 5, maximum: 5 means value === 5
  // This is impossible, so all constraints should be deleted
  const case6: AutoBeOpenApi.IJsonSchema.INumber =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "number",
      minimum: 5,
      maximum: 5,
      exclusiveMinimum: 5,
    });
  TestValidator.equals("min === max with conflicting exclusive", case6, {
    type: "number",
  });

  // Case 7: negative multipleOf -> delete
  const case7: AutoBeOpenApi.IJsonSchema.INumber =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "number",
      multipleOf: -5,
    });
  TestValidator.equals("negative multipleOf", case7, {
    type: "number",
  });

  // Case 8: integer minimum decimal -> ceil
  const case8: AutoBeOpenApi.IJsonSchema.IInteger =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "integer",
      minimum: 1.5,
    });
  TestValidator.equals("integer minimum decimal", case8, {
    type: "integer",
    minimum: 2,
  });

  // Case 9: integer maximum decimal -> floor
  const case9: AutoBeOpenApi.IJsonSchema.IInteger =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "integer",
      maximum: 9.7,
    });
  TestValidator.equals("integer maximum decimal", case9, {
    type: "integer",
    maximum: 9,
  });

  // Case 10: integer exclusiveMinimum decimal -> floor
  const case10: AutoBeOpenApi.IJsonSchema.IInteger =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "integer",
      exclusiveMinimum: 3.2,
    });
  TestValidator.equals("integer exclusiveMinimum decimal", case10, {
    type: "integer",
    exclusiveMinimum: 3,
  });

  // Case 11: integer exclusiveMaximum decimal -> ceil
  const case11: AutoBeOpenApi.IJsonSchema.IInteger =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "integer",
      exclusiveMaximum: 7.8,
    });
  TestValidator.equals("integer exclusiveMaximum decimal", case11, {
    type: "integer",
    exclusiveMaximum: 8,
  });

  // Case 12: valid range (unchanged)
  const case12: AutoBeOpenApi.IJsonSchema.INumber =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "number",
      minimum: 0,
      maximum: 100,
    });
  TestValidator.equals("valid range unchanged", case12, {
    type: "number",
    minimum: 0,
    maximum: 100,
  });

  // Case 13: integer minimum + exclusiveMaximum with single valid value -> const
  // minimum: 4 means value >= 4, exclusiveMaximum: 5 means value < 5
  // For integers, only 4 is valid -> const: 4
  const case13: AutoBeOpenApi.IJsonSchema.IConstant =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "integer",
      minimum: 4,
      exclusiveMaximum: 5,
    }) as AutoBeOpenApi.IJsonSchema.IConstant;
  TestValidator.equals("integer minimum + exclusiveMaximum -> const", case13, {
    const: 4,
  });

  // Case 14: integer exclusiveMinimum + maximum with single valid value -> const
  // exclusiveMinimum: 3 means value > 3, maximum: 4 means value <= 4
  // For integers, only 4 is valid -> const: 4
  const case14: AutoBeOpenApi.IJsonSchema.IConstant =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "integer",
      exclusiveMinimum: 3,
      maximum: 4,
    }) as AutoBeOpenApi.IJsonSchema.IConstant;
  TestValidator.equals("integer exclusiveMinimum + maximum -> const", case14, {
    const: 4,
  });

  // Case 15: integer exclusiveMinimum + exclusiveMaximum with single valid value -> const
  // exclusiveMinimum: 3 means value > 3, exclusiveMaximum: 5 means value < 5
  // For integers, only 4 is valid -> const: 4
  const case15: AutoBeOpenApi.IJsonSchema.IConstant =
    AutoBeJsonSchemaFactory.fixSchema({
      type: "integer",
      exclusiveMinimum: 3,
      exclusiveMaximum: 5,
    }) as AutoBeOpenApi.IJsonSchema.IConstant;
  TestValidator.equals(
    "integer exclusiveMinimum + exclusiveMaximum -> const",
    case15,
    {
      const: 4,
    },
  );
};
