import { tags } from "typia";

import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeRealizeTestOperationEvent
  extends AutoBeEventBase<"realizeTestOperation"> {
  name: string;
  location: string;
  value: unknown;
  error: null | unknown;
  completed_at: string & tags.Format<"date-time">;
  total: number;
  completed: number;
  step: number;
}
