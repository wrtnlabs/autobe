import { AutoBeTest } from "@autobe/interface";
import ts from "typescript";
import { Escaper } from "typia/lib/utils/Escaper";

import { IAutoBeTestProgrammerContext } from "../IAutoBeTestProgrammerContext";
import { writeTestExpression } from "../writeTestExpression";

export namespace AutoBeTestLiteralProgrammer {
  export const booleanLiteral = (
    _ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IBooleanLiteral,
  ): ts.BooleanLiteral =>
    expr.value ? ts.factory.createTrue() : ts.factory.createFalse();

  export const numericLiteral = (
    _ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.INumericLiteral,
  ): ts.NumericLiteral | ts.PrefixUnaryExpression =>
    expr.value < 0
      ? ts.factory.createPrefixUnaryExpression(
          ts.SyntaxKind.MinusToken,
          ts.factory.createNumericLiteral(-expr.value),
        )
      : ts.factory.createNumericLiteral(expr.value);

  export const stringLiteral = (
    _ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IStringLiteral,
  ): ts.StringLiteral => ts.factory.createStringLiteral(expr.value);

  export const arrayLiteral = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IArrayLiteral,
  ): ts.ArrayLiteralExpression =>
    ts.factory.createArrayLiteralExpression(
      expr.elements.map((elem) => writeTestExpression(ctx, elem)),
      true,
    );

  export const objectLiteral = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IObjectLiteral,
  ): ts.ObjectLiteralExpression =>
    ts.factory.createObjectLiteralExpression(
      expr.properties.map((e) =>
        ts.factory.createPropertyAssignment(
          Escaper.variable(e.name)
            ? ts.factory.createIdentifier(e.name)
            : ts.factory.createStringLiteral(e.name),
          writeTestExpression(ctx, e.value),
        ),
      ),
      true,
    );

  export const nullLiteral = (
    _ctx: IAutoBeTestProgrammerContext,
    _expr: AutoBeTest.INullLiteral,
  ): ts.NullLiteral => ts.factory.createNull();

  export const undefinedKeyword = (
    _ctx: IAutoBeTestProgrammerContext,
    _expr: AutoBeTest.IUndefinedKeyword,
  ): ts.Identifier => ts.factory.createIdentifier("undefined");
}
