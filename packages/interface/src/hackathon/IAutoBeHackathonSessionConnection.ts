import { tags } from "typia";

export interface IAutoBeHackathonSessionConnection {
  id: string;
  created_at: string & tags.Format<"date-time">;
  disconnected_at: null | (string & tags.Format<"date-time">);
}
