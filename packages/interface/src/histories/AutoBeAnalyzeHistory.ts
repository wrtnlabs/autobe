import { tags } from "typia";

import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeAnalyzeHistory
  extends AutoBeAgentHistoryBase<"analyze"> {
  reason: string;
  step: number;
  prefix: string;
  files: Record<string, string>;
  completed_at: string & tags.Format<"date-time">;
}
