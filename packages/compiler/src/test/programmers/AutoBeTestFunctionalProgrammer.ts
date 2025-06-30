import { AutoBeTest } from "@autobe/interface";
import ts from "typescript";

import { IAutoBeTestProgrammerContext } from "../IAutoBeTestProgrammerContext";
import { writeTestExpression } from "../writeTestExpression";
import { writeTestStatement } from "../writeTestStatement";

export namespace AutoBeTestFunctionalProgrammer {
  export const arrowFunction = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IArrowFunction,
  ): ts.ArrowFunction =>
    ts.factory.createArrowFunction(
      undefined,
      undefined,
      [],
      undefined,
      undefined,
      writeTestStatement(ctx, expr.body)[0] as ts.Block,
    );

  export const callExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.ICallExpression,
  ): ts.CallExpression =>
    ts.factory.createCallExpression(
      writeTestExpression(ctx, expr.expression),
      undefined,
      expr.arguments.map((arg) => writeTestExpression(ctx, arg)),
    );

  export const newExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.INewExpression,
  ): ts.NewExpression =>
    ts.factory.createNewExpression(
      writeTestExpression(ctx, expr.expression),
      undefined,
      expr.arguments.map((arg) => writeTestExpression(ctx, arg)),
    );

  export const conditionalExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IConditionalExpression,
  ): ts.ConditionalExpression =>
    ts.factory.createConditionalExpression(
      writeTestExpression(ctx, expr.condition),
      undefined,
      writeTestExpression(ctx, expr.whenTrue),
      undefined,
      writeTestExpression(ctx, expr.whenFalse),
    );

  export const prefixUnaryExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IPrefixUnaryExpression,
  ): ts.PrefixUnaryExpression =>
    ts.factory.createPrefixUnaryExpression(
      PREFIX_UNARY_OPERATORS[expr.operator],
      writeTestExpression(ctx, expr.operand),
    );

  export const postfixUnaryExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IPostfixUnaryExpression,
  ): ts.PostfixUnaryExpression =>
    ts.factory.createPostfixUnaryExpression(
      writeTestExpression(ctx, expr.operand),
      POSTFIX_UNARY_OPERATORS[expr.operator],
    );

  export const binaryExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IBinaryExpression,
  ): ts.BinaryExpression =>
    ts.factory.createBinaryExpression(
      writeTestExpression(ctx, expr.left),
      OPERATORS[expr.operator],
      writeTestExpression(ctx, expr.right),
    );
}

const POSTFIX_UNARY_OPERATORS = {
  "++": ts.SyntaxKind.PlusPlusToken,
  "--": ts.SyntaxKind.MinusMinusToken,
} as const;

const PREFIX_UNARY_OPERATORS = {
  ...POSTFIX_UNARY_OPERATORS,
  "!": ts.SyntaxKind.ExclamationToken,
} as const;

const OPERATORS = {
  "===": ts.SyntaxKind.EqualsEqualsEqualsToken,
  "!==": ts.SyntaxKind.ExclamationEqualsEqualsToken,
  "<": ts.SyntaxKind.LessThanToken,
  "<=": ts.SyntaxKind.LessThanEqualsToken,
  ">": ts.SyntaxKind.GreaterThanToken,
  ">=": ts.SyntaxKind.GreaterThanEqualsToken,
  "+": ts.SyntaxKind.PlusToken,
  "-": ts.SyntaxKind.MinusToken,
  "*": ts.SyntaxKind.AsteriskToken,
  "/": ts.SyntaxKind.SlashToken,
  "%": ts.SyntaxKind.PercentToken,
  "&&": ts.SyntaxKind.AmpersandAmpersandToken,
  "||": ts.SyntaxKind.BarBarToken,
} as const;
