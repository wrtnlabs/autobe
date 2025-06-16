import { IAutoBeTypeScriptCompilerResult } from "../compiler";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeTestValidateEvent
  extends AutoBeEventBase<"testValidate"> {
  files: Record<string, string>;
  result:
    | IAutoBeTypeScriptCompilerResult.IFailure
    | IAutoBeTypeScriptCompilerResult.IException
    | IAutoBeTypeScriptCompilerResult.ISuccess;
  step: number;
}
