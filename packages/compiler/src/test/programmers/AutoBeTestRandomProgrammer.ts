import { AutoBeTest } from "@autobe/interface";
import ts from "typescript";
import { ExpressionFactory } from "typia/lib/factories/ExpressionFactory";

import { IAutoBeTestProgrammerContext } from "./IAutoBeTestProgrammerContext";
import { writeTestExpression } from "./writeTestExpression";

export namespace AutoBeTestRandomProgrammer {
  export const pickRandom = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IPickRandom,
  ): ts.CallExpression =>
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(
          ctx.importer.external({
            type: "instance",
            library: "@nestia/e2e",
            name: "RandomGenerator",
          }),
        ),
        "pick",
      ),
      undefined,
      [writeTestExpression(ctx, expr.array)],
    );

  export const sampleRandom = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.ISampleRandom,
  ): ts.CallExpression =>
    ExpressionFactory.currying({
      function: ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(
          ctx.importer.external({
            type: "instance",
            library: "@nestia/e2e",
            name: "RandomGenerator",
          }),
        ),
        "sample",
      ),
      arguments: [
        writeTestExpression(ctx, expr.array),
        writeTestExpression(ctx, expr.count),
      ],
    });

  export const booleanRandom = (
    _ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IBooleanRandom,
  ): ts.BinaryExpression =>
    ts.factory.createLessThanEquals(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier("Math"),
          "random",
        ),
        undefined,
        undefined,
      ),
      ts.factory.createNumericLiteral(expr.probability ?? 0.5),
    );

  export const integerRandom = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IIntegerRandom,
  ): ts.CallExpression => {
    const intersection: ts.TypeNode[] = [
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
      createTypiaTag(ctx, "Type", [
        ts.factory.createLiteralTypeNode(
          ts.factory.createStringLiteral("int32"),
        ),
      ]),
    ];
    if (expr.minimum !== null && expr.minimum !== undefined)
      intersection.push(
        createTypiaTag(ctx, "Minimum", [
          ts.factory.createLiteralTypeNode(
            ts.factory.createNumericLiteral(expr.minimum),
          ),
        ]),
      );
    if (expr.maximum !== null && expr.maximum !== undefined)
      intersection.push(
        createTypiaTag(ctx, "Maximum", [
          ts.factory.createLiteralTypeNode(
            ts.factory.createNumericLiteral(expr.maximum),
          ),
        ]),
      );
    if (expr.multipleOf !== null && expr.multipleOf !== undefined)
      intersection.push(
        createTypiaTag(ctx, "MultipleOf", [
          ts.factory.createLiteralTypeNode(
            ts.factory.createNumericLiteral(expr.multipleOf),
          ),
        ]),
      );
    return createTypiaRandom(ctx, intersection);
  };

  export const numberRandom = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.INumberRandom,
  ): ts.CallExpression => {
    const intersection: ts.TypeNode[] = [
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
    ];
    if (expr.minimum !== null && expr.minimum !== undefined)
      intersection.push(
        createTypiaTag(ctx, "Minimum", [
          ts.factory.createLiteralTypeNode(
            ts.factory.createNumericLiteral(expr.minimum),
          ),
        ]),
      );
    if (expr.maximum !== null && expr.maximum !== undefined)
      intersection.push(
        createTypiaTag(ctx, "Maximum", [
          ts.factory.createLiteralTypeNode(
            ts.factory.createNumericLiteral(expr.maximum),
          ),
        ]),
      );
    if (expr.multipleOf !== null && expr.multipleOf !== undefined)
      intersection.push(
        createTypiaTag(ctx, "MultipleOf", [
          ts.factory.createLiteralTypeNode(
            ts.factory.createNumericLiteral(expr.multipleOf),
          ),
        ]),
      );
    return createTypiaRandom(ctx, intersection);
  };

  export const stringRandom = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IStringRandom,
  ): ts.CallExpression => {
    const intersection: ts.TypeNode[] = [
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
    ];
    if (expr.minLength !== null && expr.minLength !== undefined)
      intersection.push(
        createTypiaTag(ctx, "MinLength", [
          ts.factory.createLiteralTypeNode(
            ts.factory.createNumericLiteral(expr.minLength),
          ),
        ]),
      );
    if (expr.maxLength !== null && expr.maxLength !== undefined)
      intersection.push(
        createTypiaTag(ctx, "MaxLength", [
          ts.factory.createLiteralTypeNode(
            ts.factory.createNumericLiteral(expr.maxLength),
          ),
        ]),
      );
    return createTypiaRandom(ctx, intersection);
  };

  export const formatRandom = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IFormatRandom,
  ): ts.CallExpression =>
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(
          ctx.importer.external({
            type: "default",
            library: "typia",
            name: "typia",
          }),
        ),
        "random",
      ),
      [
        ts.factory.createIntersectionTypeNode([
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          ts.factory.createTypeReferenceNode(
            ts.factory.createQualifiedName(
              ts.factory.createIdentifier(
                ctx.importer.external({
                  type: "instance",
                  library: "typia",
                  name: "tags",
                }),
              ),
              ts.factory.createIdentifier("Format"),
            ),
            [
              ts.factory.createLiteralTypeNode(
                ts.factory.createStringLiteral(expr.format),
              ),
            ],
          ),
        ]),
      ],
      [],
    );

  export const patternRandom = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IPatternRandom,
  ): ts.CallExpression =>
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(
          ctx.importer.external({
            type: "default",
            library: "typia",
            name: "typia",
          }),
        ),
        "random",
      ),
      [
        ts.factory.createIntersectionTypeNode([
          ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
          ts.factory.createTypeReferenceNode(
            ts.factory.createQualifiedName(
              ts.factory.createIdentifier(
                ctx.importer.external({
                  type: "instance",
                  library: "typia",
                  name: "tags",
                }),
              ),
              ts.factory.createIdentifier("Pattern"),
            ),
            [
              ts.factory.createLiteralTypeNode(
                ts.factory.createStringLiteral(expr.pattern),
              ),
            ],
          ),
        ]),
      ],
      [],
    );

  export const keywordRandom = (
    ctx: IAutoBeTestProgrammerContext,
    expr: AutoBeTest.IKeywordRandom,
  ): ts.Expression => {
    let value: ts.Expression = ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier(
        ctx.importer.external({
          type: "instance",
          library: "@nestia/e2e",
          name: "RandomGenerator",
        }),
      ),
      expr.keyword,
    );
    new Array(KEYWORD_CURRYING_COUNT[expr.keyword]).fill(0).forEach(() => {
      value = ts.factory.createCallExpression(value, undefined, undefined);
    });
    return value;
  };
}

const createTypiaTag = (
  ctx: IAutoBeTestProgrammerContext,
  name: string,
  typeArguments: ts.TypeNode[],
) =>
  ts.factory.createTypeReferenceNode(
    ts.factory.createQualifiedName(
      ts.factory.createIdentifier(
        ctx.importer.external({
          type: "instance",
          library: "typia",
          name: "tags",
        }),
      ),
      ts.factory.createIdentifier(name),
    ),
    typeArguments,
  );

const createTypiaRandom = (
  ctx: IAutoBeTestProgrammerContext,
  typeArguments: ts.TypeNode[] = [],
) =>
  ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier(
        ctx.importer.external({
          type: "default",
          library: "typia",
          name: "typia",
        }),
      ),
      "random",
    ),
    typeArguments.length === 0
      ? undefined
      : typeArguments.length === 1
        ? typeArguments
        : [ts.factory.createIntersectionTypeNode(typeArguments)],
    undefined,
  );

const KEYWORD_CURRYING_COUNT = {
  alphabets: 1,
  alphaNumeric: 1,
  mobile: 1,
  name: 1,
  paragraph: 2,
  content: 3,
};
