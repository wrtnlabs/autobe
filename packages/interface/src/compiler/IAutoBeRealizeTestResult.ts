import { tags } from "typia";

import { IAutoBeRealizeTestOperation } from "./IAutoBeRealizeTestOperation";

export interface IAutoBeRealizeTestResult {
  reset: boolean;
  simulaneous: number;
  operations: IAutoBeRealizeTestOperation[];
  started_at: string & tags.Format<"date-time">;
  completed_at: string & tags.Format<"date-time">;
}
