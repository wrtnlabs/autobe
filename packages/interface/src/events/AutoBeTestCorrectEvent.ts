import { IAutoBeTypeScriptCompilerResult } from "../compiler";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeTestCorrectEvent extends AutoBeEventBase<"testCorrect"> {
  created_at: string;
  files: Record<string, string>;
  result: IAutoBeTypeScriptCompilerResult.IFailure;
  think_without_compile_error: string;
  think_again_with_compile_error: string;
  solution: string;
  step: number;
}
