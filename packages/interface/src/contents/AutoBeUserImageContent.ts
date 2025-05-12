import { tags } from "typia";

import { AutoBeUserContentBase } from "./AutoBeUserContentBase";

export interface AutoBeUserImageContent extends AutoBeUserContentBase<"image"> {
  url: string & tags.Format<"iri">;
  id?: string;
  name?: string;
}
