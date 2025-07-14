import { tags } from "typia";

export interface IAutoBeRealizeTestOperation {
  name: string;
  location: string;
  value: unknown;
  error: null | unknown;
  started_at: string & tags.Format<"date-time">;
  completed_at: string & tags.Format<"date-time">;
}
