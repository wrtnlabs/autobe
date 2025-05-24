import { tags } from "typia";

import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeAssistantMessageHistory
  extends AutoBeAgentHistoryBase<"assistantMessage"> {
  text: string;
  completed_at: string & tags.Format<"date-time">;
}
