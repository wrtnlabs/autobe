import { tags } from "typia";

import { IAutoBeEventJson } from "../json/IAutoBeEventJson";

export interface AutoBeEventBase<Type extends IAutoBeEventJson.Type> {
  type: Type;
  created_at: string & tags.Format<"date-time">;
}
