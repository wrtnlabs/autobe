import { tags } from "typia";

import { IAutoBeRealizeTestOperation } from "../compiler/IAutoBeRealizeTestOperation";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeRealizeTestCompleteEvent
  extends AutoBeEventBase<"realizeTestComplete"> {
  operations: IAutoBeRealizeTestOperation[];
  completed_at: string & tags.Format<"date-time">;
  step: number;
}
