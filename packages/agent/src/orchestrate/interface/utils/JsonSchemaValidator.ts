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
    const elements: string[] = props.key.split(".");
    if (elements.every(Escaper.variable) === false)
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
    if (props.key.endsWith(".IPage")) {
      const expected: string = `IPage${props.key.substring(0, props.key.length - 6)}`;
      props.errors.push({
        path: `${props.path}[${JSON.stringify(props.key)}]`,
        expected: `"IPage" must be followed by another interface name. Use ${JSON.stringify(expected)} instead.`,
        value: props.key,
        description: StringUtil.trim`
          "IPage" is a reserved type name for pagination response.
          The pagination data type name must be post-fixed after "IPage".
          
          However, you've defined ${JSON.stringify(props.key)}, 
          post-fixing ".IPage" after the pagination data type name.

          Change it to a valid pagination type name to be
          ${JSON.stringify(expected)} at the next time. Note that,
          this is not a recommendation, but an instruction you must follow.
        `,
      });
    } else if (props.key === "IPageIRequest")
      props.errors.push({
        path: `${props.path}[${JSON.stringify(props.key)}]`,
        expected: `"IPageIRequest" is a mistake. Use "IPage.IRequest" instead.`,
        value: props.key,
        description: StringUtil.trim`
          You've taken a mistake that defines "IPageIRequest" as a type name.
          However, as you've intended to define a pagination request type, 
          the correct type name is "IPage.IRequest" instead of "IPageIRequest".

          Change it to "IPage.IRequest" at the next time.
        `,
      });
    else if (
      props.key.startsWith("IPage") &&
      props.key.startsWith("IPageI") === false
    ) {
      const expected: string = `IPage${props.key
        .substring(5)
        .split(".")
        .map((s) => (s.startsWith("I") ? s : `I${s}`))
        .join(".")}`;
      props.errors.push({
        path: `${props.path}[${JSON.stringify(props.key)}]`,
        expected: `Interface name starting with 'I' even after 'IPage': ${JSON.stringify(expected)}`,
        value: props.key,
        description: StringUtil.trim`
          JSON schema type name must be an interface name starting with 'I'.
          Even though JSON schema type name allows dot(.) character, but
          each segment separated by dot(.) must be an interface name starting
          with 'I'.

          Even in the case of pagination response, after 'IPage' prefix,
          the remaining part must be an interface name starting with 'I'.
          
          Current key name ${JSON.stringify(props.key)} is not valid. Change
          it to a valid interface name to be  ${JSON.stringify(expected)},
          or change it to another valid interface name at the next time.
        `,
      });
    } else if (elements.some((s) => s.startsWith("I") === false) === true) {
      const expected: string = elements
        .map((s) => (s.startsWith("I") ? s : `I${s}`))
        .join(".");
      props.errors.push({
        path: `${props.path}[${JSON.stringify(props.key)}]`,
        expected: `Interface name starting with 'I': ${JSON.stringify(expected)}`,
        value: props.key,
        description: StringUtil.trim`
          JSON schema type name must be an interface name starting with 'I'.
          Even though JSON schema type name allows dot(.) character, but
          each segment separated by dot(.) must be an interface name starting
          with 'I'.

          Current key name ${JSON.stringify(props.key)} is not valid. Change
          it to a valid interface name to be ${JSON.stringify(expected)}, 
          or change it to another valid interface name at the next time.
        `,
      });
    }
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
