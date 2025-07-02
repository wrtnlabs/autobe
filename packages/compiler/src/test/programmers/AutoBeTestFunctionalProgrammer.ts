import { AutoBeTest } from "@autobe/interface";
import ts from "typescript";
import { ExpressionFactory } from "typia/lib/factories/ExpressionFactory";

import { IAutoBeTestProgrammerContext } from "../IAutoBeTestProgrammerContext";
import { writeTestExpression } from "../writeTestExpression";
import { AutoBeTestStatementProgrammer } from "./AutoBeTestStatementProgrammer";

export namespace AutoBeTestFunctionalProgrammer {
  export const arrowFunction = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IArrowFunction,
  ): ts.ArrowFunction =>
    ts.factory.createArrowFunction(
      [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
      undefined,
      [],
      undefined,
      undefined,
      AutoBeTestStatementProgrammer.block(ctx, expr.body),
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

  export const arrayFilterExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IArrayFilterExpression,
  ): ts.AwaitExpression =>
    arrayExpression(ctx, "asyncFilter", [expr.expression, expr.function]);

  export const arrayForEachExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IArrayForEachExpression,
  ): ts.AwaitExpression =>
    arrayExpression(ctx, "asyncForEach", [expr.expression, expr.function]);

  export const arrayMapExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IArrayMapExpression,
  ): ts.AwaitExpression =>
    arrayExpression(ctx, "asyncMap", [expr.expression, expr.function]);

  export const arrayRepeatExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IArrayRepeatExpression,
  ): ts.AwaitExpression =>
    arrayExpression(ctx, "asyncRepeat", [expr.length, expr.function]);
}

const arrayExpression = (
  ctx: IAutoBeTestProgrammerContext,
  name: string,
  argList: AutoBeTest.IExpression[],
): ts.AwaitExpression =>
  ts.factory.createAwaitExpression(
    ExpressionFactory.currying({
      function: ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(
          ctx.importer.external({
            type: "instance",
            library: "@nestia/e2e",
            name: "ArrayUtil",
          }),
        ),
        name,
      ),
      arguments: argList.map((a) => writeTestExpression(ctx, a)),
    }),
  );

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
