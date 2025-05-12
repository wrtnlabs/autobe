import { tags } from "typia";

import { AutoBeUserMessageContentBase } from "./AutoBeUserMessageContentBase";

export interface AutoBeUserMessageImageContent
  extends AutoBeUserMessageContentBase<"image"> {
  url: string & tags.Format<"url">;
  detail?: "auto" | "high" | "low" | undefined;
}
