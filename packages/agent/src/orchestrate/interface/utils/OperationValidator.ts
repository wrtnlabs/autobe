import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { IValidation } from "typia";
import { Escaper } from "typia/lib/utils/Escaper";

import { JsonSchemaValidator } from "./JsonSchemaValidator";

export namespace OperationValidator {
  export const validate = (props: {
    errors: IValidation.IError[];
    path: string;
    operation: Omit<
      AutoBeOpenApi.IOperation,
      "authorizationActor" | "authorizationType" | "prerequisites"
    >;
  }): void => {
    // get method has request body
    if (
      props.operation.method === "get" &&
      props.operation.requestBody !== null
    )
      props.errors.push({
        path: `${props.path}.requestBody`,
        expected:
          "GET method should not have request body. Change method, or re-design the operation.",
        value: props.operation.requestBody,
      });
    // operation name
    if (Escaper.variable(props.operation.name) === false)
      props.errors.push({
        path: `${props.path}.name`,
        expected: "<valid_variable_name>",
        value: props.operation.name,
        description: StringUtil.trim`
            The operation name will be converted to the API controller method
            (function) name, so the operation.name must be a valid JavaScript 
            variable/function name.

            However, what you've configured value ${JSON.stringify(props.operation.name)}
            is not a valid JavaScript variable/function name. Please change
            it to a valid variable/function name.
          `,
      });
    // validate types
    if (props.operation.requestBody !== null) {
      validatePrimitiveBody({
        kind: "requestBody",
        errors: props.errors,
        path: `${props.path}.requestBody`,
        body: props.operation.requestBody,
      });
      JsonSchemaValidator.validateKey({
        errors: props.errors,
        path: `${props.path}.requestBody.typeName`,
        key: props.operation.requestBody.typeName,
      });
    }
    if (props.operation.responseBody !== null) {
      validatePrimitiveBody({
        kind: "responseBody",
        errors: props.errors,
        path: `${props.path}.responseBody`,
        body: props.operation.responseBody,
      });
      JsonSchemaValidator.validateKey({
        errors: props.errors,
        path: `${props.path}.responseBody.typeName`,
        key: props.operation.responseBody.typeName,
      });
    }
  };

  const validatePrimitiveBody = (props: {
    kind: "requestBody" | "responseBody";
    errors: IValidation.IError[];
    path: string;
    body: AutoBeOpenApi.IRequestBody | AutoBeOpenApi.IResponseBody;
  }): void => {
    if (props.body.typeName === "undefined" || props.body.typeName === "null")
      props.errors.push({
        path: props.path,
        value: props.body,
        expected: "null",
        description: StringUtil.trim`
          Type ${props.body.typeName} does not mean anything in ${props.kind}.

          Change it to \`null\` if you want to set empty ${props.kind}.
        `,
      });
    else if (
      props.body.typeName === "number" ||
      props.body.typeName === "string" ||
      props.body.typeName === "boolean"
    )
      props.errors.push({
        path: `${props.path}.typeName`,
        value: props.body.typeName,
        expected: "An object reference type encapsulating the primitive type",
        description: StringUtil.trim`
          Primitive type ${props.body.typeName} is not allowed as the ${props.kind} type.

          If you want to use primitive type in the ${props.kind},
          encapsulate it in an object reference type. For example, instead of using
          \`${props.body.typeName}\`, define an object reference type like below:

          - ${props.body.typeName[0].toUpperCase()}${props.body.typeName.slice(1)}Value
        `,
      });
    else if (
      props.body.typeName === "object" ||
      props.body.typeName === "any" ||
      props.body.typeName === "interface"
    )
      props.errors.push({
        path: `${props.path}.typeName`,
        value: props.body.typeName,
        expected: "An object reference type",
        description: StringUtil.trim`
          Type \`${props.body.typeName}\` is preserved word in the programming languages.

          Change the type name to other one.
        `,
      });
    else if (props.body.typeName.startsWith("I") === false) {
    }
  };
}
