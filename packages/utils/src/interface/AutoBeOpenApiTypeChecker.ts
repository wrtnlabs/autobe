import { AutoBeOpenApi } from "@autobe/interface";

export namespace AutoBeOpenApiTypeChecker {
  export const isArray = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IArray =>
    (schema as AutoBeOpenApi.IJsonSchema.IArray).type === "array";

  export const isObject = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IObject =>
    (schema as AutoBeOpenApi.IJsonSchema.IObject).type === "object";

  export const isOneOf = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IOneOf =>
    (schema as AutoBeOpenApi.IJsonSchema.IOneOf).oneOf !== undefined;

  export const isReference = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IReference =>
    (schema as AutoBeOpenApi.IJsonSchema.IReference).$ref !== undefined;

  export const isConstant = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IConstant =>
    (schema as AutoBeOpenApi.IJsonSchema.IConstant).const !== undefined;

  export const isInteger = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IInteger =>
    (schema as AutoBeOpenApi.IJsonSchema.IInteger).type === "integer";

  export const isNumber = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.INumber =>
    (schema as AutoBeOpenApi.IJsonSchema.INumber).type === "number";

  export const isString = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IString =>
    (schema as AutoBeOpenApi.IJsonSchema.IString).type === "string";
}
