import { OpenApi } from "@samchon/openapi";
import typia, { tags } from "typia";

export const IEntitySchema: OpenApi.IJsonSchema =
  typia.json.schema<IEntity>().components.schemas?.IEntity!;

/** Just a basic entity interface for referencing. */
interface IEntity {
  /** Primary Key. */
  id: string & tags.Format<"uuid">;
}
