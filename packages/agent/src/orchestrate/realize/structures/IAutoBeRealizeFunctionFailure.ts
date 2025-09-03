import {
  AutoBeRealizeFunction,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";

export interface IAutoBeRealizeFunctionFailure {
  function: AutoBeRealizeFunction;
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
}
