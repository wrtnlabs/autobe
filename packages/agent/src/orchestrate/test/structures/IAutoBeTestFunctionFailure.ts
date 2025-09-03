import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";

import { IAutoBeTestFunction } from "./IAutoBeTestFunction";

export interface IAutoBeTestFunctionFailure {
  function: IAutoBeTestFunction;
  failure: IAutoBeTypeScriptCompileResult.IFailure;
}
