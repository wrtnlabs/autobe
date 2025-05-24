import { tags } from "typia";

import { IAutoBeTypeScriptCompilerResult } from "../compiler/IAutoBeTypeScriptCompilerResult";
import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeTestHistory extends AutoBeAgentHistoryBase<"test"> {
  result: IAutoBeTypeScriptCompilerResult;
  files: Record<string, string>;
  reason: string;
  step: number;
  completed_at: string & tags.Format<"date-time">;
}
