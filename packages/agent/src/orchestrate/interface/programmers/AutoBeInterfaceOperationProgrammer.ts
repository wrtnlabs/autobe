import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { IValidation } from "typia";
import { Escaper } from "typia/lib/utils/Escaper";

import { AutoBeJsonSchemaValidator } from "../utils/AutoBeJsonSchemaValidator";

export namespace AutoBeInterfaceOperationProgrammer {
  export const validate = (props: {
    errors: IValidation.IError[];
    accessor: string;
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
        path: `${props.accessor}.requestBody`,
        expected: "null (GET method cannot have request body)",
        value: props.operation.requestBody,
        description: StringUtil.trim`
          GET method cannot have request body per HTTP specification.

          Fix: Change method to "patch" for complex queries, 
          or set requestBody to null.
        `,
      });
    // operation name
    if (Escaper.variable(props.operation.name) === false)
      props.errors.push({
        path: `${props.accessor}.name`,
        expected: "<valid_variable_name>",
        value: props.operation.name,
        description: StringUtil.trim`
            Operation name "${props.operation.name}" is not a valid 
            JavaScript variable name.
            
            It will be used as a controller method name, so it must be 
            a valid identifier.
          `,
      });
    // validate path parameters match with path
    validatePathParameters({
      errors: props.errors,
      operation: props.operation,
      accessor: props.accessor,
    });
    // validate types
    if (props.operation.requestBody !== null) {
      validatePrimitiveBody({
        kind: "requestBody",
        errors: props.errors,
        path: `${props.accessor}.requestBody`,
        body: props.operation.requestBody,
      });
      AutoBeJsonSchemaValidator.validateKey({
        errors: props.errors,
        path: `${props.accessor}.requestBody.typeName`,
        key: props.operation.requestBody.typeName,
      });
    }
    if (props.operation.responseBody !== null) {
      validatePrimitiveBody({
        kind: "responseBody",
        errors: props.errors,
        path: `${props.accessor}.responseBody`,
        body: props.operation.responseBody,
      });
      AutoBeJsonSchemaValidator.validateKey({
        errors: props.errors,
        path: `${props.accessor}.responseBody.typeName`,
        key: props.operation.responseBody.typeName,
      });
    }
  };

  const validatePathParameters = (props: {
    errors: IValidation.IError[];
    operation: Omit<
      AutoBeOpenApi.IOperation,
      "authorizationActor" | "authorizationType" | "prerequisites"
    >;
    accessor: string;
  }): void => {
    // Check parameter → path matching and uniqueness
    const parameterNames = new Set<string>();
    props.operation.parameters.forEach((p, i) => {
      // Check if parameter exists in path
      if (props.operation.path.includes(`{${p.name}}`) === false)
        props.errors.push({
          path: `${props.accessor}.parameters[${i}]`,
          expected: `removed, or expressed in AutoBeOpenApi.IOperation.path`,
          value: p,
          description: StringUtil.trim`
            Parameter "${p.name}" is defined but not used in path "${props.operation.path}".

            Fix: Remove parameter at index ${i}, or add {${p.name}} to the path.
          `,
        });
      parameterNames.add(p.name);
    });

    // Check for duplicate parameter names
    if (parameterNames.size !== props.operation.parameters.length)
      props.errors.push({
        path: `${props.accessor}.parameters`,
        expected: `All parameter names must be unique`,
        value: props.operation.parameters,
        description: StringUtil.trim`
          Duplicate parameter names found: ${props.operation.parameters.length} parameters, but only ${parameterNames.size} unique names.

          Parameters: ${props.operation.parameters.map((p, idx) => `[${idx}]="${p.name}"`).join(", ")}

          Fix: Remove duplicate parameter definitions.
        `,
      });

    const symbols: string[] = props.operation.path
      .split("{")
      .slice(1)
      .map((s) => s.split("}")[0]);

    // Check path → parameters matching
    symbols.forEach((s) => {
      if (props.operation.parameters.some((p) => p.name === s) === false)
        props.errors.push({
          path: `${props.accessor}.path`,
          expected: `removed, or defined in AutoBeOpenApi.IOperation.parameters[]`,
          value: s,
          description: StringUtil.trim`
            Path contains "{${s}}" but no corresponding parameter definition exists.

            Current parameters: ${props.operation.parameters.length === 0 ? "[]" : `[${props.operation.parameters.map((p) => `"${p.name}"`).join(", ")}]`}

            Fix: Add parameter definition for "${s}", or remove {${s}} from path.
          `,
        });
    });

    // Check for duplicate path parameters
    const uniqueSymbols = new Set(symbols);
    if (uniqueSymbols.size !== symbols.length)
      props.errors.push({
        path: `${props.accessor}.path`,
        expected: `All path parameter names must be unique`,
        value: props.operation.path,
        description: StringUtil.trim`
          Duplicate path parameter names: ${symbols.length} parameters, 
          but only ${uniqueSymbols.size} unique names in "${props.operation.path}".

          Path parameters: ${symbols.map((s, idx) => `[${idx}]="{${s}}"`).join(", ")}

          Fix: Rename duplicate parameters to be unique. 
          
          (e.g., {userId} and {postId} instead of {userId} twice).
        `,
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
          Type "${props.body.typeName}" is not valid for ${props.kind}. 
          
          Use null for empty ${props.kind}.
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
          Primitive type "${props.body.typeName}" not allowed 
          for ${props.kind}. 
          
          Encapsulate in object type (e.g., I${props.body.typeName[0].toUpperCase()}${props.body.typeName.slice(1)}Value).
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
          Type "${props.body.typeName}" is a reserved word. Use a different type name.
        `,
      });
    else if (props.body.typeName.startsWith("I") === false) {
      props.errors.push({
        path: `${props.path}.typeName`,
        value: props.body.typeName,
        expected: "Type name starting with 'I' (e.g., IUser, IProduct, IOrder)",
        description: StringUtil.trim`
          Type name "${props.body.typeName}" must start with 'I' prefix 
          per AutoBE naming convention.

          Fix: Rename to "I${props.body.typeName.charAt(0).toUpperCase()}${props.body.typeName.slice(1)}" 
          (e.g., IUser, IProduct).
        `,
      });
    }
  };
}
