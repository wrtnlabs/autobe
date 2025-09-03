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

  export const isReference = (
    schema: AutoBeOpenApi.IJsonSchema,
  ): schema is AutoBeOpenApi.IJsonSchema.IReference =>
    (schema as AutoBeOpenApi.IJsonSchema.IReference).$ref !== undefined;
}
