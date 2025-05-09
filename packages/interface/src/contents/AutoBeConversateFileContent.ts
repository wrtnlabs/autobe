import { tags } from "typia";

import { AutoBeConversateContentBase } from "./AutoBeConversateContentBase";

export interface AutoBeConversateFileContent
  extends AutoBeConversateContentBase<"file"> {
  url: string & tags.Format<"iri">;
  id?: string;
  name?: string;
}
