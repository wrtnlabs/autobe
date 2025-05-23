import { IAutoBeTypeScriptCompilerResult } from "../compiler/IAutoBeTypeScriptCompilerResult";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeRealizeValidateEvent
  extends AutoBeEventBase<"realizeValidate"> {
  files: Record<string, string>;
  result:
    | IAutoBeTypeScriptCompilerResult.IFailure
    | IAutoBeTypeScriptCompilerResult.IException;
  step: number;
}
