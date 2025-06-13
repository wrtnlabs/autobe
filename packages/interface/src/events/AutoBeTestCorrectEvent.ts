import { IAutoBeTypeScriptCompilerResult } from "../compiler";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeTestCorrectEvent extends AutoBeEventBase<"testCorrect"> {
  created_at: string;
  files: Record<string, string>;
  result: IAutoBeTypeScriptCompilerResult.ISuccess;
  step: number;
}
