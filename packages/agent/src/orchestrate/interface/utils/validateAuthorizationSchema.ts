import { AutoBeOpenApi } from "@autobe/interface";
import { IValidation } from "typia";

export const validateAuthorizationSchema = (props: {
  errors: IValidation.IError[];
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  path: string;
}): void => {
  for (const [key, value] of Object.entries(props.schemas)) {
    if (!key.endsWith(".IAuthorized")) continue;

    // Check if it's an object type
    if (!isObjectSchema(value)) {
      props.errors.push({
        path: `${props.path}.${key}`,
        expected: `AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema.IObject>`,
        value: value,
        description: `${key} must be an object type for authorization responses`,
      });
      continue;
    }

    // Check if token property exists
    value.properties ??= {};
    value.properties["token"] = {
      $ref: "#/components/schemas/IAuthorizationToken",
      description: "JWT token information for authentication",
    } as AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema.IReference>;

    value.required ??= [];
    if (value.required.includes("token") === false) {
      value.required.push("token");
    }
  }
};

const isObjectSchema = (
  schema: AutoBeOpenApi.IJsonSchemaDescriptive,
): schema is AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema.IObject> => {
  return "type" in schema && schema.type === "object";
};
