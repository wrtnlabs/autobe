import { IAutoBeTypeScriptCompilerResult } from "../compiler/IAutoBeTypeScriptCompilerResult";
import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeRealizeHistory
  extends AutoBeAgentHistoryBase<"realize"> {
  files: Record<string, string>;
  result: IAutoBeTypeScriptCompilerResult;
  reason: string;
  step: number;
}
