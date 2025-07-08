import { AutoBeOpenApi, AutoBeTest } from "@autobe/interface";
import { HashMap } from "tstl";
import typia from "typia";

import { IAutoBeTextValidateContext } from "./IAutoBeTextValidateContext";

export const validateTestApiOperateStatement = (
  ctx: IAutoBeTextValidateContext,
  stmt: AutoBeTest.IApiOperateStatement,
  path: string,
): void => {
  // Check API endpoint
  const it: HashMap.Iterator<
    AutoBeOpenApi.IEndpoint,
    AutoBeOpenApi.IOperation
  > = ctx.endpoints.find(stmt.endpoint);
  if (it.equals(ctx.endpoints.end()) === true) {
    ctx.errors.push({
      path: `${path}.endpoint`,
      value: stmt.endpoint,
      expected: ctx.document.operations
        .map((o) => `AutoBeOpenApi.IEndpoint<"${o.method}", "${o.path}">`)
        .join(" | "),
      description: [
        "You can use only endpoints defined in the OpenAPI document.",
        "",
        ctx.document.operations
          .map((o) => `- { method: "${o.method}", path: "${o.path}" }`)
          .join("\n"),
      ].join("\n"),
    });
    return;
  }
  const operation: AutoBeOpenApi.IOperation = it.second;

  // Check function argument
  const needArgument: boolean =
    operation.requestBody !== null || operation.parameters.length !== 0;
  if (!!stmt.argument !== needArgument) {
    // required argument, but is not
    // or not required, but is provided
    ctx.errors.push({
      path: `${path}.argument`,
      value: stmt.argument,
      expected:
        needArgument === true
          ? typia.reflect.name<AutoBeTest.IObjectLiteralExpression>()
          : "null",
    });
  } else if (!!stmt.argument) {
    // check properties
    const keys: Set<string> = new Set(
      stmt.argument.properties.map((p) => p.name),
    );
    for (const p of operation.parameters) // path parameters
      if (keys.has(p.name) === false)
        ctx.errors.push({
          path: `${path}.argument.${p.name}`,
          value: undefined,
          expected: JSON.stringify(p.schema),
          description: `Parameter "${p.name}" is required, and its type is ${JSON.stringify(p.schema)}. However, you did not provide it.`,
        });
    if (operation.requestBody !== null && keys.has("body") === false) {
      // request body is not provided
      ctx.errors.push({
        path: `${path}.argument.body`,
        value: undefined,
        expected: operation.requestBody.typeName,
        description: `Request body is required, and its type is "${operation.requestBody.typeName}". However, you did not provide it.`,
      });
    }
  }

  // Check function return type
  if (!!stmt.variableName !== !!operation.responseBody) {
    ctx.errors.push({
      path: `${path}.variableName`,
      value: stmt.variableName,
      ...(stmt.variableName === null || stmt.variableName === undefined
        ? {
            expected: "string",
            description:
              "You have to provide variable name. Every API operations that returning value require it, and it is used to store the response body.",
          }
        : {
            expected: typia.reflect.name<AutoBeTest.IIdentifier>(),
            description:
              "You don't have to provide variable name. The API operation does not return any value, so it is not needed.",
          }),
    });
  }
};
