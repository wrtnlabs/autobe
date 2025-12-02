import {
  AutoBeRealizeFunction,
  IAutoBeTypeScriptCompileResult,
} from "@autobe/interface";

export interface IAutoBeRealizeFunctionFailure<
  RealizeFunction extends AutoBeRealizeFunction,
> {
  function: RealizeFunction;
  diagnostics: IAutoBeTypeScriptCompileResult.IDiagnostic[];
}
