import { AutoBeTest } from "@autobe/interface";
import ts from "typescript";

import { IAutoBeTestProgrammerContext } from "./IAutoBeTestProgrammerContext";
import { writeTestExpression } from "./writeTestExpression";

export namespace AutoBeTestPredicateProgrammer {
  export const equalPredicate = (
    ctx: IAutoBeTestProgrammerContext,
    expression: AutoBeTest.IEqualPredicate,
  ): ts.CallExpression =>
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(
          ctx.importer.external({
            type: "instance",
            library: "@nestia/e2e",
            name: "TestValidator",
          }),
        ),
        "equals",
      ),
      undefined,
      [
        ts.factory.createStringLiteral(expression.title),
        writeTestExpression(ctx, expression.x),
        writeTestExpression(ctx, expression.y),
      ],
    );

  export const notEqualPredicate = (
    ctx: IAutoBeTestProgrammerContext,
    expression: AutoBeTest.INotEqualPredicate,
  ): ts.CallExpression =>
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(
          ctx.importer.external({
            type: "instance",
            library: "@nestia/e2e",
            name: "TestValidator",
          }),
        ),
        "error",
      ),
      undefined,
      [
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
    );

  export const conditionalPredicate = (
    ctx: IAutoBeTestProgrammerContext,
    expression: AutoBeTest.IConditionalPredicate,
  ): ts.CallExpression =>
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(
          ctx.importer.external({
            type: "instance",
            library: "@nestia/e2e",
            name: "TestValidator",
          }),
        ),
        "predicate",
      ),
      undefined,
      [
        ts.factory.createStringLiteral(expression.title),
        writeTestExpression(ctx, expression.expression),
      ],
    );

  export const errorPredicate = (
    ctx: IAutoBeTestProgrammerContext,
    expression: AutoBeTest.IErrorPredicate,
  ): ts.CallExpression =>
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(
          ctx.importer.external({
            type: "instance",
            library: "@nestia/e2e",
            name: "TestValidator",
          }),
        ),
        "error",
      ),
      undefined,
      [
        ts.factory.createStringLiteral(expression.title),
        writeTestExpression(ctx, expression.function),
      ],
    );

  // export const httpErrorPredicate = (
  //   ctx: IAutoBeTestProgrammerContext,
  //   expression: AutoBeTest.IHttpErrorPredicate,
  // ): ts.CallExpression =>
  //   ts.factory.createCallExpression(
  //     ts.factory.createPropertyAccessExpression(
  //       ts.factory.createIdentifier(
  //         ctx.importer.external({
  //           type: "instance",
  //           library: "@nestia/e2e",
  //           name: "TestValidator",
  //         }),
  //       ),
  //       "httpError",
  //     ),
  //     undefined,
  //     [
  //       ts.factory.createStringLiteral(expression.title),
  //       ts.factory.createNumericLiteral(expression.status),
  //       writeTestExpression(ctx, expression.function),
  //     ],
  //   );
}
