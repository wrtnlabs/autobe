import { tags } from "typia";

/** Just a base entity interface for referencing. */
export interface IEntity {
  /** Primary Key. */
  id: string & tags.Format<"uuid">;
}
