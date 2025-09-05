import { tags } from "typia";

export interface IEntity {
  id: string & tags.Format<"uuid">;
}
