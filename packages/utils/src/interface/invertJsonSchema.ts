import { AutoBeOpenApi } from "@autobe/interface";
import { OpenApi, OpenApiTypeChecker } from "@samchon/openapi";

export const invertJsonSchema = (
  schema: OpenApi.IJsonSchema,
): AutoBeOpenApi.IJsonSchema => {
  // SPECIFIC TYPES
  if (OpenApiTypeChecker.isReference(schema))
    return {
      ...schema,
      type: "reference",
    };
  else if (OpenApiTypeChecker.isOneOf(schema))
    return {
      ...schema,
      oneOf: schema.oneOf.map((sub) => invertJsonSchema(sub)) as Exclude<
        AutoBeOpenApi.IJsonSchema,
        AutoBeOpenApi.IJsonSchema.IOneOf | AutoBeOpenApi.IJsonSchema.IObject
      >[],
      type: "oneOf",
    } satisfies AutoBeOpenApi.IJsonSchema.IOneOf;
  else if (OpenApiTypeChecker.isConstant(schema))
    return {
      ...schema,
      type: "constant",
    };
  // NESTED TYPES
  else if (OpenApiTypeChecker.isArray(schema))
    return {
      ...schema,
      items: invertJsonSchema(schema.items) as Exclude<
        AutoBeOpenApi.IJsonSchema,
        AutoBeOpenApi.IJsonSchema.IObject
      >,
    };
  else if (OpenApiTypeChecker.isObject(schema))
    return {
      ...schema,
      properties: Object.fromEntries(
        Object.entries(schema.properties ?? {}).map(([key, val]) => [
          key,
          invertJsonSchema(val) as Exclude<
            AutoBeOpenApi.IJsonSchemaDescriptive,
            AutoBeOpenApi.IJsonSchemaDescriptive.IObject
          >,
        ]),
      ),
      additionalProperties:
        typeof schema.additionalProperties === "object" &&
        schema.additionalProperties !== null
          ? (invertJsonSchema(schema.additionalProperties) as Exclude<
              AutoBeOpenApi.IJsonSchema,
              AutoBeOpenApi.IJsonSchema.IObject
            >)
          : schema.additionalProperties === true
            ? false
            : schema.additionalProperties,
      required: schema.required ?? [],
    };
  return schema as AutoBeOpenApi.IJsonSchema;
};
