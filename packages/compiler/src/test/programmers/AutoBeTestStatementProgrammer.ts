import { AutoBeTest } from "@autobe/interface";
import { NestiaMigrateSchemaProgrammer } from "@nestia/migrate/lib/programmers/NestiaMigrateSchemaProgrammer";
import ts from "typescript";

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
}
