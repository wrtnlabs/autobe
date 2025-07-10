import { AutoBeOpenApi, AutoBeTest } from "@autobe/interface";
import { HashMap } from "tstl";
import typia from "typia";

import { IAutoBeTextValidateContext } from "./IAutoBeTextValidateContext";

export const validateTestApiOperateStatement = (
  ctx: IAutoBeTextValidateContext,
  stmt: AutoBeTest.IApiOperateStatement,
  path: string,
): void => {
  const it: HashMap.Iterator<
    AutoBeOpenApi.IEndpoint,
    AutoBeOpenApi.IOperation
  > = ctx.endpoints.find(stmt.endpoint);
  if (it.equals(ctx.endpoints.end()) === true) {
    ctx.errors.push({
      path: `${path}.endpoint`,
      value: stmt.endpoint,
      expected: [
        "You can use only endpoints defined in the OpenAPI document.",
        "",
        ctx.document.operations
          .map((o) => `- ${o.method} ${o.path}`)
          .join("\n"),
      ].join("\n"),
    });
    return;
  }

  const operation: AutoBeOpenApi.IOperation = it.second;
  const needArgument: boolean =
    operation.requestBody !== null || operation.parameters.length !== 0;
  if (!!stmt.argument !== needArgument) {
    ctx.errors.push({
      path: `${path}.argument`,
      value: stmt.argument,
      expected:
        needArgument === true
          ? typia.reflect.name<AutoBeTest.IObjectLiteralExpression>()
          : "null",
    });
    return;
  } else if (stmt.argument !== null) {
    // check properties
    const keys: Set<string> = new Set(
      stmt.argument.properties.map((p) => p.name),
    );
    for (const p of operation.parameters)
      if (keys.has(p.name) === false)
        ctx.errors.push({
          path: `${path}.argument.${p.name}`,
          value: "undefined",
          expected: JSON.stringify(p.schema),
        });
    if (operation.requestBody !== null && keys.has("body") === false)
      ctx.errors.push({
        path: `${path}.argument.body`,
        value: "undefined",
        expected: operation.requestBody.typeName,
      });

    // check variable name
    if (stmt.variableName === null)
      ctx.errors.push({
        path: `${path}.variableName`,
        value: null,
        expected: "string",
      });
  } else {
    // check variable name
    if (stmt.variableName !== null)
      ctx.errors.push({
        path: `${path}.variableName`,
        value: stmt.variableName,
        expected: "null",
      });
  }
};
