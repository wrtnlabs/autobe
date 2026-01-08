import { AutoBeOpenApi } from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { IValidation } from "typia";
import { Escaper } from "typia/lib/utils/Escaper";

import { AutoBeJsonSchemaValidator } from "./AutoBeJsonSchemaValidator";

export namespace AutoBeInterfaceOperationValidator {
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
        expected:
          "GET method should not have request body. Change method, or re-design the operation.",
        value: props.operation.requestBody,
      });
    // operation name
    if (Escaper.variable(props.operation.name) === false)
      props.errors.push({
        path: `${props.accessor}.name`,
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
    props.operation.parameters.forEach((p, i) => {
      if (props.operation.path.includes(`{${p.name}}`) === false)
        props.errors.push({
          path: `${props.accessor}.parameters[${i}]`,
          expected: `undefined, or expressed in AutoBeOpenApi.IOperation.path`,
          value: p,
          description: StringUtil.trim`
            Path parameter mismatch detected: The parameters array contains a
            parameter definition with name "${p.name}", but the operation path
            "${props.operation.path}" does not contain the corresponding path
            parameter "{${p.name}}".

            According to the OpenAPI specification and AutoBeOpenApi.IOperation
            interface, every parameter defined in the parameters array MUST appear
            in the operation path enclosed in curly braces.

            There are two ways to fix this error:

            Option 1 - Remove the unused parameter (Recommended if not needed):
            If "${p.name}" is not actually required for this API operation, simply
            remove it from the parameters array at index ${i}.

            Option 2 - Add the parameter to the path (If the parameter is needed):
            If "${p.name}" is required for this operation, add it to the path string.

            Current path:  ${props.operation.path}
            Example fix:   ${props.operation.path}/{${p.name}}

            (Adjust the position of {${p.name}} based on your API design and resource
            hierarchy. It should be placed where it makes semantic sense in the URL
            structure.)

            Example of correct path/parameters alignment:
            Path: "/users/{userId}/posts/{postId}"
            Parameters: [
              { "name": "userId", "description": "...", "schema": {...} },
              { "name": "postId", "description": "...", "schema": {...} }
            ]

            This validation ensures that there are no orphaned parameter definitions
            that could lead to confusion during code generation or API implementation.
            Every parameter definition must have a clear purpose and location in the
            path.
          `,
        });
    });
    if (
      new Set(props.operation.parameters.map((p) => p.name)).size !==
      props.operation.parameters.length
    )
      props.errors.push({
        path: `${props.accessor}.parameters`,
        expected: `All parameter names must be unique`,
        value: props.operation.parameters,
        description: StringUtil.trim`
          Duplicate parameter names detected: The parameters array contains
          multiple parameters with the same name. Each parameter name must be
          unique within the operation.

          Current parameters array has ${props.operation.parameters.length} parameters,
          but only ${new Set(props.operation.parameters.map((p) => p.name)).size} unique names.

          Parameter names in the array:
          ${props.operation.parameters.map((p, idx) => `  [${idx}]: "${p.name}"`).join("\n")}

          This error occurs when you accidentally define the same path parameter
          multiple times in the parameters array. According to the OpenAPI
          specification, each parameter must have a unique name within the scope
          of an operation.

          To fix this error:

          1. Review the parameters array and identify which parameter names are
             duplicated
          2. Remove all duplicate entries, keeping only one definition for each
             unique parameter name
          3. Ensure each parameter name corresponds to exactly one path parameter
             in the operation path

          Example of INCORRECT parameters (with duplicates):
          [
            { "name": "userId", "description": "...", "schema": {...} },
            { "name": "postId", "description": "...", "schema": {...} },
            { "name": "userId", "description": "...", "schema": {...} }  // ❌ Duplicate!
          ]

          Example of CORRECT parameters (all unique):
          [
            { "name": "userId", "description": "...", "schema": {...} },
            { "name": "postId", "description": "...", "schema": {...} }
          ]

          This validation prevents ambiguity in the generated code and ensures
          that each path parameter has exactly one type definition.
        `,
      });

    const symbols: string[] = props.operation.path
      .split("{")
      .slice(1)
      .map((s) => s.split("}")[0]);
    symbols.forEach((s) => {
      if (props.operation.parameters.some((p) => p.name === s) === false)
        props.errors.push({
          path: `${props.accessor}.path`,
          expected: `removed, or defined in AutoBeOpenApi.IOperation.parameters[]`,
          value: s,
          description: StringUtil.trim`
            Missing parameter definition detected: The operation path contains
            a path parameter "{${s}}", but there is no corresponding parameter
            definition in the parameters array.

            According to the OpenAPI specification and AutoBeOpenApi.IOperation
            interface, every path parameter that appears in the operation path
            (enclosed in curly braces like {paramName}) MUST have a corresponding
            entry in the parameters array with a matching name.

            Current situation:
            - Path: "${props.operation.path}"
            - Missing parameter definition for: "${s}"
            - Current parameters: ${props.operation.parameters.length === 0 ? "[]" : `[${props.operation.parameters.map((p) => `"${p.name}"`).join(", ")}]`}

            There are two ways to fix this error:

            Option 1 - Add the missing parameter definition (Recommended):
            Add a parameter definition for "${s}" to the parameters array:

            {
              "name": "${s}",
              "description": "<clear description of what this parameter represents>",
              "schema": {
                "type": "string",
                "format": "uuid"  // or appropriate type/format for your use case
              }
            }

            For example, if the parameter represents a user ID, the description
            might be "Unique identifier of the target user" and the schema would
            typically be a UUID string.

            Option 2 - Remove the parameter from the path (If not needed):
            If "{${s}}" is not actually needed for this API operation, remove it
            from the path string.

            Current path: ${props.operation.path}
            Suggested fix: ${props.operation.path.replace(`{${s}}`, "").replace(/\/+/g, "/")}

            This validation ensures that the generated TypeScript code will have
            proper type definitions for all path parameters, preventing runtime
            errors and maintaining type safety throughout the application. Every
            path parameter must be fully specified with its type, format, and
            description.
          `,
        });
    });
    if (new Set(symbols).size !== symbols.length)
      props.errors.push({
        path: `${props.accessor}.path`,
        expected: `All path parameter names must be unique`,
        value: props.operation.path,
        description: StringUtil.trim`
          Duplicate path parameter names detected: The operation path contains
          multiple path parameters with the same name. Each path parameter must
          be unique within the path string.

          Current path: ${props.operation.path}
          Total path parameters found: ${symbols.length}
          Unique path parameter names: ${new Set(symbols).size}

          Path parameters extracted from the path:
          ${symbols.map((s, idx) => `  [${idx}]: "{${s}}"`).join("\n")}

          This error occurs when you use the same parameter name multiple times
          in the path string. According to the OpenAPI specification and REST API
          best practices, each path parameter must appear exactly once in a path.

          Common mistake example (INCORRECT):
          "/users/{userId}/posts/{userId}/comments"  // ❌ userId appears twice!

          Correct approach:
          "/users/{userId}/posts/{postId}/comments"  // ✅ Each parameter is unique

          To fix this error:

          1. Review your path string and identify which parameter names are duplicated
          2. Rename the duplicate parameters to have unique, descriptive names that
             reflect their specific role in the path hierarchy
          3. Update the corresponding parameter definitions in the parameters array
             to match the new names

          For example, if you have a path with nested resources of the same type:
          - Instead of: "/categories/{categoryId}/subcategories/{categoryId}"
          - Use: "/categories/{categoryId}/subcategories/{subcategoryId}"

          This ensures that:
          - Each path parameter can be uniquely identified and validated
          - The generated TypeScript code has clear, non-conflicting parameter names
          - API consumers can distinguish between different parameters in the path
          - The routing logic can correctly extract and map path parameters

          This validation prevents ambiguity in parameter binding and ensures that
          the generated controller methods have properly typed, non-conflicting
          parameter names.
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
