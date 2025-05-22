import { tags } from "typia";

export interface AutoBeAgentHistoryBase<Type extends string> {
  id: string & tags.Format<"uuid">;
  type: Type;
  created_at: string & tags.Format<"date-time">;
}
