import { AutoBeTest } from "@autobe/interface";
import ts from "typescript";

import { IAutoBeTestProgrammerContext } from "../IAutoBeTestProgrammerContext";
import { writeTestExpression } from "../writeTestExpression";

export namespace AutoBeTestAccessorProgrammer {
  export const identifier = (
    _ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IIdentifier,
  ): ts.Identifier => ts.factory.createIdentifier(expr.text);

  export const propertyAccessExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IPropertyAccessExpression,
  ): ts.PropertyAccessChain | ts.PropertyAccessExpression =>
    expr.questionDot
      ? ts.factory.createPropertyAccessChain(
          writeTestExpression(ctx, expr.expression),
          ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
          expr.name,
        )
      : ts.factory.createPropertyAccessExpression(
          writeTestExpression(ctx, expr.expression),
          expr.name,
        );

  export const elementAccessExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IElementAccessExpression,
  ): ts.ElementAccessChain | ts.ElementAccessExpression =>
    expr.questionDot
      ? ts.factory.createElementAccessChain(
          writeTestExpression(ctx, expr.expression),
          ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
          writeTestExpression(ctx, expr.argumentExpression),
        )
      : ts.factory.createElementAccessExpression(
          writeTestExpression(ctx, expr.expression),
          writeTestExpression(ctx, expr.argumentExpression),
        );
}
