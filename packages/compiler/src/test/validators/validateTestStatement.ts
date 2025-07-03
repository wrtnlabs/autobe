import { AutoBeTest } from "@autobe/interface";

import { IAutoBeTextValidateContext } from "./IAutoBeTextValidateContext";
import { validateTestApiOperateStatement } from "./validateTestApiOperateStatement";
import { validateTestBlock } from "./validateTestBlock";
import { validateTestExpression } from "./validateTestExpression";

export const validateTestStatement = (
  ctx: IAutoBeTextValidateContext,
  stmt: AutoBeTest.IStatement,
  path: string,
): void => {
  if (stmt.type === "apiOperateStatement")
    validateTestApiOperateStatement(ctx, stmt, path);
  else if (stmt.type === "expressionStatement")
    validateTestExpression(ctx, stmt.expression, `${path}.expression`);
  else if (stmt.type === "ifStatement") {
    validateTestExpression(ctx, stmt.condition, `${path}.condition`);
    validateTestBlock(ctx, stmt.thenStatement, `${path}.thenStatement`);
    if (stmt.elseStatement !== null)
      if (stmt.elseStatement.type === "block")
        validateTestBlock(ctx, stmt.elseStatement, `${path}.elseStatement`);
      else
        validateTestStatement(ctx, stmt.elseStatement, `${path}.elseStatement`);
  } else if (stmt.type === "returnStatement")
    validateTestExpression(ctx, stmt.expression, `${path}.expression`);
  else if (stmt.type === "throwStatement")
    validateTestExpression(ctx, stmt.expression, `${path}.expression`);
  else if (stmt.type === "variableDeclaration")
    validateTestExpression(ctx, stmt.initializer, `${path}.initializer`);
  else {
    stmt satisfies never;
    throw new Error("Invalid test statement type");
  }
};
