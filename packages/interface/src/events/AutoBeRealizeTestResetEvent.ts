import { tags } from "typia";

import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeRealizeTestResetEvent
  extends AutoBeEventBase<"realizeTestReset"> {
  completed_at: string & tags.Format<"date-time">;
  step: number;
}
