import { IAutoBeTypeScriptCompilerResult } from "../compiler/IAutoBeTypeScriptCompilerResult";
import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeTestHistory extends AutoBeAgentHistoryBase<"test"> {
  result: IAutoBeTypeScriptCompilerResult;
  reason: string;
  description: string;
  step: number;
}
