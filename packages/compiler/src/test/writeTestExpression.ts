import { AutoBeTest } from "@autobe/interface";
import ts from "typescript";

import { IAutoBeTestProgrammerContext } from "./IAutoBeTestProgrammerContext";
import { AutoBeTestAccessorProgrammer } from "./programmers/AutoBeTestAccessorProgrammer";
import { AutoBeTestFunctionalProgrammer } from "./programmers/AutoBeTestFunctionalProgrammer";
import { AutoBeTestLiteralProgrammer } from "./programmers/AutoBeTestLiteralProgrammer";
import { AutoBeTestPredicateProgrammer } from "./programmers/AutoBeTestPredicateProgrammer";
import { AutoBeTestRandomProgrammer } from "./programmers/AutoBeTestRandomProgrammer";

export const writeTestExpression = (
  ctx: IAutoBeTestProgrammerContext,
  expr: AutoBeTest.IExpression,
): ts.Expression => factory[expr.type](ctx, expr as any);

const factory = {
  ...AutoBeTestAccessorProgrammer,
  ...AutoBeTestFunctionalProgrammer,
  ...AutoBeTestLiteralProgrammer,
  ...AutoBeTestRandomProgrammer,
  ...AutoBeTestPredicateProgrammer,
};
