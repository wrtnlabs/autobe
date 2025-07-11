import { AutoBeTest } from "@autobe/interface";

import { IAutoBeTextValidateContext } from "./IAutoBeTextValidateContext";
import { validateTestApiOperateStatement } from "./validateTestApiOperateStatement";
import { validateTestExpression } from "./validateTestExpression";
import { validateTestStatement } from "./validateTestStatement";

export namespace AutoBeTestStatementValidator {
  export const block = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IBlock,
    path: string,
  ): void => {
    item.statements.forEach((stmt, i) =>
      validateTestStatement(ctx, stmt, `${path}.statements[${i}]`),
    );
  };

  export const apiOperateStatement = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IApiOperateStatement,
    path: string,
  ): void => {
    validateTestApiOperateStatement(ctx, item, path);
  };

  export const expressionStatement = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IExpressionStatement,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.expression, `${path}.expression`);
  };

  export const ifStatement = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IIfStatement,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.condition, `${path}.condition`);
    block(ctx, item.thenStatement, `${path}.thenStatement`);
    if (!!item.elseStatement)
      if (item.elseStatement.type === "block")
        block(ctx, item.elseStatement, `${path}.elseStatement`);
      else
        validateTestStatement(ctx, item.elseStatement, `${path}.elseStatement`);
  };

  export const returnStatement = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IReturnStatement,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.expression, `${path}.expression`);
  };

  export const throwStatement = (
    ctx: IAutoBeTextValidateContext,
    item: AutoBeTest.IThrowStatement,
    path: string,
  ): void => {
    validateTestExpression(ctx, item.expression, `${path}.expression`);
  };

  // export const variableDeclaration = (
  //   ctx: IAutoBeTextValidateContext,
  //   item: AutoBeTest.IVariableDeclaration,
  //   path: string,
  // ): void => {
  //   validateTestExpression(ctx, item.initializer, `${path}.initializer`);
  // };
}
