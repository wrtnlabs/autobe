import { tags } from "typia";

export interface IAutoBeHackathon extends IAutoBeHackathon.ISummary {}
export namespace IAutoBeHackathon {
  export interface ISummary extends ICreate {
    id: string & tags.Format<"uuid">;
    created_at: string & tags.Format<"date-time">;
  }

  export interface ICreate {
    code: string;
    name: string;
    opened_at: string & tags.Format<"date-time">;
    closed_at: string & tags.Format<"date-time">;
  }
}
