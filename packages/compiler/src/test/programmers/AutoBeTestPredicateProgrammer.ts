import { AutoBeTest } from "@autobe/interface";
import ts from "typescript";
import { ExpressionFactory } from "typia/lib/factories/ExpressionFactory";

import { IAutoBeTestProgrammerContext } from "./IAutoBeTestProgrammerContext";
import { writeTestExpression } from "./writeTestExpression";

export namespace AutoBeTestPredicateProgrammer {
  export const equalPredicate = (
    ctx: IAutoBeTestProgrammerContext,
    expression: AutoBeTest.IEqualPredicate,
  ): ts.CallExpression =>
    ExpressionFactory.currying({
      function: ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(
          ctx.importer.external({
            type: "instance",
            library: "@nestia/e2e",
            name: "TestValidator",
          }),
        ),
        "equals",
      ),
      arguments: [
        ts.factory.createStringLiteral(expression.title),
        writeTestExpression(ctx, expression.x),
        writeTestExpression(ctx, expression.y),
      ],
    });

  export const notEqualPredicate = (
    ctx: IAutoBeTestProgrammerContext,
    expression: AutoBeTest.INotEqualPredicate,
  ): ts.CallExpression =>
    ExpressionFactory.currying({
      function: ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(
          ctx.importer.external({
            type: "instance",
            library: "@nestia/e2e",
            name: "TestValidator",
          }),
        ),
        "error",
      ),
      arguments: [
        ts.factory.createStringLiteral(expression.title),
        ts.factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          undefined,
          equalPredicate(ctx, {
            type: "equalPredicate",
            title: expression.title,
            x: expression.x,
            y: expression.y,
          }),
        ),
      ],
    });

  export const conditionalPredicate = (
    ctx: IAutoBeTestProgrammerContext,
    expression: AutoBeTest.IConditionalPredicate,
  ): ts.CallExpression =>
    ExpressionFactory.currying({
      function: ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(
          ctx.importer.external({
            type: "instance",
            library: "@nestia/e2e",
            name: "TestValidator",
          }),
        ),
        "conditional",
      ),
      arguments: [
        ts.factory.createStringLiteral(expression.title),
        writeTestExpression(ctx, expression.expression),
      ],
    });

  export const errorPredicate = (
    ctx: IAutoBeTestProgrammerContext,
    expression: AutoBeTest.IErrorPredicate,
  ): ts.CallExpression =>
    ExpressionFactory.currying({
      function: ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(
          ctx.importer.external({
            type: "instance",
            library: "@nestia/e2e",
            name: "TestValidator",
          }),
        ),
        "error",
      ),
      arguments: [
        ts.factory.createStringLiteral(expression.title),
        writeTestExpression(ctx, expression.function),
      ],
    });
}
