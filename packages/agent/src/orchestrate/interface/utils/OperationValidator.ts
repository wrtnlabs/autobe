import { AutoBeOpenApi } from "@autobe/interface";
import { AutoBeEndpointComparator, StringUtil } from "@autobe/utils";
import { HashMap } from "tstl";
import { IValidation } from "typia";
import { Escaper } from "typia/lib/utils/Escaper";

import { emplaceMap } from "../../../utils/emplaceMap";
import { JsonSchemaValidator } from "./JsonSchemaValidator";

export namespace OperationValidator {
  export interface IProps {
    errors: IValidation.IError[];
    path: string;
    operations: Array<
      Omit<AutoBeOpenApi.IOperation, "authorizationRole" | "authorizationType">
    >;
  }
  export const validate = (props: IProps): void => {
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
      if (op.requestBody !== null)
        JsonSchemaValidator.validateKey({
          errors: props.errors,
          path: `${props.path}[${i}].requestBody.typeName`,
          key: op.requestBody.typeName,
        });
      if (op.responseBody !== null) {
        JsonSchemaValidator.validateKey({
          errors: props.errors,
          path: `${props.path}[${i}].responseBody.typeName`,
          key: op.responseBody.typeName,
        });
      }
    });

    // validate duplicated endpoints
    const endpoints: HashMap<AutoBeOpenApi.IEndpoint, number[]> = new HashMap(
      AutoBeEndpointComparator.hashCode,
      AutoBeEndpointComparator.equals,
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
}
