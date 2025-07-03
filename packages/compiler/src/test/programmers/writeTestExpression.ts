import { AutoBeTest } from "@autobe/interface";
import ts from "typescript";

import { AutoBeTestAccessorProgrammer } from "./AutoBeTestAccessorProgrammer";
import { AutoBeTestFunctionalProgrammer } from "./AutoBeTestFunctionalProgrammer";
import { AutoBeTestLiteralProgrammer } from "./AutoBeTestLiteralProgrammer";
import { AutoBeTestOperatorProgrammer } from "./AutoBeTestOperatorProgrammer";
import { AutoBeTestPredicateProgrammer } from "./AutoBeTestPredicateProgrammer";
import { AutoBeTestRandomProgrammer } from "./AutoBeTestRandomProgrammer";
import { IAutoBeTestProgrammerContext } from "./IAutoBeTestProgrammerContext";

export const writeTestExpression = (
  ctx: IAutoBeTestProgrammerContext,
  expr: AutoBeTest.IExpression,
): ts.Expression => factory[expr.type](ctx, expr as any);

const factory = {
  ...AutoBeTestLiteralProgrammer,
  ...AutoBeTestOperatorProgrammer,
  ...AutoBeTestAccessorProgrammer,
  ...AutoBeTestFunctionalProgrammer,
  ...AutoBeTestRandomProgrammer,
  ...AutoBeTestPredicateProgrammer,
};
