import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeOpenApiEndpointComparator, StringUtil } from "@autobe/utils";
import { HashMap } from "tstl";
import { IValidation } from "typia";
import { Escaper } from "typia/lib/utils/Escaper";

import { emplaceMap } from "../../../utils/emplaceMap";
import { JsonSchemaValidator } from "./JsonSchemaValidator";

export namespace OperationValidator {
  export const validate = (props: {
    errors: IValidation.IError[];
    path: string;
    operations: Array<
      Omit<
        AutoBeOpenApi.IOperation,
        "authorizationActor" | "authorizationType" | "prerequisites"
      >
    >;
  }): void => {
    props.operations.forEach((op, i) => {
      // get method has request body
      if (op.method === "get" && op.requestBody !== null)
        props.errors.push({
          path: `${props.path}[${i}].requestBody`,
          expected:
            "GET method should not have request body. Change method, or re-design the operation.",
          value: op.requestBody,
        });
      // operation name
      if (Escaper.variable(op.name) === false)
        props.errors.push({
          path: `${props.path}[${i}].name`,
          expected: "<valid_variable_name>",
          value: op.name,
          description: StringUtil.trim`
            The operation name will be converted to the API controller method
            (function) name, so the operation.name must be a valid JavaScript 
            variable/function name.

            However, what you've configured value ${JSON.stringify(op.name)}
            is not a valid JavaScript variable/function name. Please change
            it to a valid variable/function name.
          `,
        });
      // validate types
      if (op.requestBody !== null) {
        validatePrimitiveBody({
          kind: "requestBody",
          errors: props.errors,
          path: `${props.path}[${i}].requestBody`,
          body: op.requestBody,
        });
        JsonSchemaValidator.validateKey({
          errors: props.errors,
          path: `${props.path}[${i}].requestBody.typeName`,
          key: op.requestBody.typeName,
        });
      }
      if (op.responseBody !== null) {
        validatePrimitiveBody({
          kind: "responseBody",
          errors: props.errors,
          path: `${props.path}[${i}].responseBody`,
          body: op.responseBody,
        });
        JsonSchemaValidator.validateKey({
          errors: props.errors,
          path: `${props.path}[${i}].responseBody.typeName`,
          key: op.responseBody.typeName,
        });
      }
    });

    // validate duplicated endpoints
    const endpoints: HashMap<AutoBeOpenApi.IEndpoint, number[]> = new HashMap(
      AutoBeOpenApiEndpointComparator.hashCode,
      AutoBeOpenApiEndpointComparator.equals,
    );
    props.operations.forEach((op, i) => {
      const key: AutoBeOpenApi.IEndpoint = {
        path: op.path,
        method: op.method,
      };
      const it = endpoints.find(key);
      if (it.equals(endpoints.end()) === false) {
        const indexes: number[] = it.second;
        props.errors.push({
          path: `${props.path}[${i}].{"path"|"method"}`,
          expected: "Unique endpoint (path and method)",
          value: key,
          description: StringUtil.trim`
            Duplicated endpoint detected (method: ${op.method}, path: ${op.path}).

            The duplicated endpoints of others are located in below accessors.
            Check them, and consider which operation endpoint would be proper to modify.
            
            ${indexes
              .map((idx) => `- ${props.path}.[${idx}].{"path"|"method"}`)
              .join("\n")}
          `,
        });
        indexes.push(i);
      } else endpoints.emplace(key, [i]);
    });

    // validate duplicated method names
    const accessors: Map<string, number[]> = new Map();
    props.operations.forEach((op, i) => {
      const key: string =
        op.path
          .split("/")
          .filter((e) => e[0] !== "{" && e.at(-1) !== "}")
          .filter((e) => e.length !== 0)
          .join(".") + `.${op.name}`;
      const indexes: number[] = emplaceMap(accessors, key, () => []);
      if (indexes.length !== 0) {
        props.errors.push({
          path: `${props.path}[${i}].name`,
          expected: "Unique name in the same accessor scope.",
          value: op.name,
          description: StringUtil.trim`
            Duplicated operation accessor detected (name: ${op.name}, accessor: ${key}).

            The operation name must be unique within the parent accessor.
            In other worlds, the operation accessor determined by the name
            must be unique in the OpenAPI document.

            Here is the list of elements of duplicated operation names.
            Check them, and consider which operation name would be proper to modify.

            ${indexes
              .map(
                (idx) => `- ${props.operations[idx].name} (accessor: ${key})`,
              )
              .join("\n")}
          `,
        });
      }
      indexes.push(i);
    });
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
