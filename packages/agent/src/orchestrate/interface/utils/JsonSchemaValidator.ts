import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeOpenApiTypeChecker, StringUtil } from "@autobe/utils";
import { IValidation } from "typia";
import { Escaper } from "typia/lib/utils/Escaper";

export namespace JsonSchemaValidator {
  export interface IProps {
    errors: IValidation.IError[];
    schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
    path: string;
  }

  export const validateSchemas = (props: IProps): void => {
    authorization(props);
    for (const key of Object.keys(props.schemas))
      validateKey({
        errors: props.errors,
        path: props.path,
        key,
      });
  };

  export const validateKey = (props: {
    errors: IValidation.IError[];
    path: string;
    key: string;
  }): void => {
    const variable: boolean = props.key.split(".").every(Escaper.variable);
    if (variable === false)
      props.errors.push({
        path: `${props.path}[${JSON.stringify(props.key)}]`,
        expected: "Valid variable name",
        value: props.key,
        description: StringUtil.trim`
            JSON schema type name must be a valid variable name.

            Even though JSON schema type name allows dot(.) character, but
            each segment separated by dot(.) must be a valid variable name.

            Current key name ${JSON.stringify(props.key)} is not valid. Change
            it to a valid variable name at the next time.
          `,
      });
  };

  const authorization = (props: IProps): void => {
    for (const [key, value] of Object.entries(props.schemas)) {
      if (!key.endsWith(".IAuthorized")) continue;
      else if (AutoBeOpenApiTypeChecker.isObject(value) === false) {
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
      } as AutoBeOpenApi.IJsonSchemaDescriptive.IReference;

      value.required ??= [];
      if (value.required.includes("token") === false)
        value.required.push("token");
    }
  };
}
