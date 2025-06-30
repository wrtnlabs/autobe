import { AutoBeTest } from "@autobe/interface";
import ts from "typescript";

import { IAutoBeTestProgrammerContext } from "./IAutoBeTestProgrammerContext";
import { AutoBeTestStatementProgrammer } from "./programmers/AutoBeTestStatementProgrammer";

export const writeTestStatement = (
  ctx: IAutoBeTestProgrammerContext,
  stmt: AutoBeTest.IStatement,
): ts.Statement[] => AutoBeTestStatementProgrammer[stmt.type](ctx, stmt as any);
