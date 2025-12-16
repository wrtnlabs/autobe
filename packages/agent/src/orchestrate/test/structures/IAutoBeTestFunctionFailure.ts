import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";

import { IAutoBeTestAgentResult } from "./IAutoBeTestAgentResult";

export interface IAutoBeTestFunctionFailure {
  target: IAutoBeTestAgentResult;
  failure: IAutoBeTypeScriptCompileResult.IFailure;
}
