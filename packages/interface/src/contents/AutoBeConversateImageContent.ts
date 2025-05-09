import { tags } from "typia";

import { AutoBeConversateContentBase } from "./AutoBeConversateContentBase";

export interface AutoBeConversateImageContent
  extends AutoBeConversateContentBase<"image"> {
  url: string & tags.Format<"iri">;
  id?: string;
  name?: string;
}
