import { AutoBeTest } from "@autobe/interface";
import { NestiaMigrateSchemaProgrammer } from "@nestia/migrate/lib/programmers/NestiaMigrateSchemaProgrammer";
import ts from "typescript";

import { IAutoBeTestApiFunction } from "../IAutoBeTestApiFunction";
import { IAutoBeTestProgrammerContext } from "../IAutoBeTestProgrammerContext";
import { writeTestExpression } from "../writeTestExpression";
import { writeTestStatement } from "../writeTestStatement";

export namespace AutoBeTestStatementProgrammer {
  export const block = (
    ctx: IAutoBeTestProgrammerContext,
    stmt: AutoBeTest.IBlock,
  ): ts.Block =>
    ts.factory.createBlock(
      stmt.statements.map((child) => writeTestStatement(ctx, child)).flat(),
      true,
    );

  export const expressionStatement = (
    ctx: IAutoBeTestProgrammerContext,
    stmt: AutoBeTest.IExpressionStatement,
  ): ts.ExpressionStatement =>
    ts.factory.createExpressionStatement(
      writeTestExpression(ctx, stmt.expression),
    );

  export const variableDeclaration = (
    ctx: IAutoBeTestProgrammerContext,
    stmt: AutoBeTest.IVariableDeclaration,
  ): ts.VariableStatement => {
    const typeNode: ts.TypeNode = NestiaMigrateSchemaProgrammer.write({
      components: ctx.document.components,
      importer: ctx.importer,
      schema: stmt.schema,
    });
    return ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            stmt.name,
            undefined,
            typeNode,
            undefined,
          ),
        ],
        stmt.mutability === "const" ? ts.NodeFlags.Constant : ts.NodeFlags.Let,
      ),
    );
  };

  export const ifStatement = (
    ctx: IAutoBeTestProgrammerContext,
    stmt: AutoBeTest.IIfStatement,
  ): ts.IfStatement =>
    ts.factory.createIfStatement(
      writeTestExpression(ctx, stmt.condition),
      block(ctx, stmt.thenStatement),
      stmt.elseStatement
        ? stmt.elseStatement.type === "ifStatement"
          ? ifStatement(ctx, stmt.elseStatement)
          : block(ctx, stmt.elseStatement)
        : undefined,
    );

  export const returnStatement = (
    ctx: IAutoBeTestProgrammerContext,
    stmt: AutoBeTest.IReturnStatement,
  ): ts.ReturnStatement =>
    ts.factory.createReturnStatement(writeTestExpression(ctx, stmt.value));

  export const throwStatement = (
    ctx: IAutoBeTestProgrammerContext,
    stmt: AutoBeTest.IThrowStatement,
  ): ts.ThrowStatement =>
    ts.factory.createThrowStatement(writeTestExpression(ctx, stmt.expression));

  export const apiOperateStatement = (
    ctx: IAutoBeTestProgrammerContext,
    stmt: AutoBeTest.IApiOperateStatement,
  ): ts.Statement[] => {
    // find the function
    const func: IAutoBeTestApiFunction = ctx.endpoints.get(stmt.endpoint);
    if (stmt.variableName !== null && func.operation.responseBody !== null)
      ctx.importer.dto(func.operation.responseBody.typeName);

    // make await function call expression
    const initializer: ts.AwaitExpression = ts.factory.createAwaitExpression(
      ts.factory.createCallExpression(
        ts.factory.createIdentifier(func.accessor),
        [],
        [
          ts.factory.createIdentifier("connection"),
          ...(stmt.argument ? [writeTestExpression(ctx, stmt.argument)] : []),
        ],
      ),
    );

    // the default statement with variable declaration?
    const output: ts.Statement[] = [
      stmt.variableName !== null
        ? ts.factory.createVariableStatement(
            undefined,
            ts.factory.createVariableDeclarationList(
              [
                ts.factory.createVariableDeclaration(
                  stmt.variableName,
                  undefined,
                  func.operation.responseBody !== null
                    ? ts.factory.createTypeReferenceNode(
                        func.operation.responseBody.typeName,
                      )
                    : ts.factory.createKeywordTypeNode(
                        ts.SyntaxKind.UndefinedKeyword,
                      ),
                  initializer,
                ),
              ],
              ts.NodeFlags.Const,
            ),
          )
        : ts.factory.createExpressionStatement(initializer),
    ];

    // typia.assert for type guard
    if (stmt.variableName !== null)
      output.push(
        ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier(
                ctx.importer.external({
                  type: "default",
                  library: "typia",
                  name: "typia",
                }),
              ),
              "assert",
            ),
            undefined,
            [ts.factory.createIdentifier(stmt.variableName)],
          ),
        ),
      );
    return output;
  };
}
