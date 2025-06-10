import { tags } from "typia";

export interface AutoBeEventBase<Type extends string> {
  type: Type;
  created_at: string & tags.Format<"date-time">;
}
