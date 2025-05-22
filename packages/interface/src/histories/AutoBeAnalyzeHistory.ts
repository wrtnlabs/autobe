import { tags } from "typia";

import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeAnalyzeHistory
  extends AutoBeAgentHistoryBase<"analyze"> {
  reason: string;
  description: string;
  step: number;
  files: Record<string, string>;
  completed_at: string & tags.Format<"date-time">;
}
