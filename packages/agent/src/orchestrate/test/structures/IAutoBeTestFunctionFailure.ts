import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";

import { IAutoBeTestProcedure } from "./IAutoBeTestProcedure";

export interface IAutoBeTestFunctionFailure<
  Procedure extends IAutoBeTestProcedure = IAutoBeTestProcedure,
> {
  procedure: Procedure;
  failure: IAutoBeTypeScriptCompileResult.IFailure;
}
