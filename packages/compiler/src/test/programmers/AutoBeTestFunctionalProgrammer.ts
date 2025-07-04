import { AutoBeTest } from "@autobe/interface";
import ts from "typescript";
import { ExpressionFactory } from "typia/lib/factories/ExpressionFactory";

import { AutoBeTestStatementProgrammer } from "./AutoBeTestStatementProgrammer";
import { IAutoBeTestProgrammerContext } from "./IAutoBeTestProgrammerContext";
import { writeTestExpression } from "./writeTestExpression";

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

  export const arrayFilterExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IArrayFilterExpression,
  ): ts.AwaitExpression =>
    arrayExpression(ctx, "asyncFilter", [expr.array, expr.function]);

  export const arrayForEachExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IArrayForEachExpression,
  ): ts.AwaitExpression =>
    arrayExpression(ctx, "asyncForEach", [expr.array, expr.function]);

  export const arrayMapExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IArrayMapExpression,
  ): ts.AwaitExpression =>
    arrayExpression(ctx, "asyncMap", [expr.array, expr.function]);

  export const arrayRepeatExpression = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IArrayRepeatExpression,
  ): ts.AwaitExpression =>
    arrayExpression(ctx, "asyncRepeat", [expr.count, expr.function]);
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
