import { tags } from "typia";

import { IAutoBeTypeScriptCompilerResult } from "../compiler/IAutoBeTypeScriptCompilerResult";
import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeRealizeHistory
  extends AutoBeAgentHistoryBase<"realize"> {
  files: Record<string, string>;
  compiled: IAutoBeTypeScriptCompilerResult;
  reason: string;
  step: number;
  completed_at: string & tags.Format<"date-time">;
}
