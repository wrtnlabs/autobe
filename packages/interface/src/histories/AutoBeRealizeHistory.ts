import { IAutoBeTypeScriptCompilerResult } from "../compiler/IAutoBeTypeScriptCompilerResult";
import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeRealizeHistory
  extends AutoBeAgentHistoryBase<"realize"> {
  result: IAutoBeTypeScriptCompilerResult;
  reason: string;
  description: string;
}
