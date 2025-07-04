import { AutoBeTest } from "@autobe/interface";
import ts from "typescript";

import { IAutoBeTestProgrammerContext } from "./IAutoBeTestProgrammerContext";
import { writeTestExpression } from "./writeTestExpression";

export namespace AutoBeTestOperatorProgrammer {
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

  export const typeOfExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.ITypeOfExpression,
  ): ts.TypeOfExpression =>
    ts.factory.createTypeOfExpression(
      writeTestExpression(ctx, expr.expression),
    );

  export const prefixUnaryExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IPrefixUnaryExpression,
  ): ts.TypeOfExpression | ts.PrefixUnaryExpression =>
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
      BINARY_OPERATORS[expr.operator],
      writeTestExpression(ctx, expr.right),
    );
}

const POSTFIX_UNARY_OPERATORS = {
  "++": ts.SyntaxKind.PlusPlusToken,
  "--": ts.SyntaxKind.MinusMinusToken,
} as const;

const PREFIX_UNARY_OPERATORS = {
  ...POSTFIX_UNARY_OPERATORS,
  "+": ts.SyntaxKind.PlusToken,
  "-": ts.SyntaxKind.MinusToken,
  "!": ts.SyntaxKind.ExclamationToken,
} as const;

const BINARY_OPERATORS = {
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
  instanceof: ts.SyntaxKind.InstanceOfKeyword,
} as const;
