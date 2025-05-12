import { tags } from "typia";

import { AutoBeUserContentBase } from "./AutoBeUserContentBase";

export interface AutoBeUserFileContent extends AutoBeUserContentBase<"file"> {
  url: string & tags.Format<"iri">;
  id?: string;
  name?: string;
}
