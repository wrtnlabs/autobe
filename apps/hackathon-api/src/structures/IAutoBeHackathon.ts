import { tags } from "typia";

export interface IAutobeHackathon {
  id: string & tags.Format<"uuid">;
  code: string;
  name: string;
  created_at: string & tags.Format<"date-time">;
  opened_at: string & tags.Format<"date-time">;
  closed_at: string & tags.Format<"date-time">;
}
export namespace IAutobeHackathon {
  export interface ISummary {
    id: string & tags.Format<"uuid">;
    code: string;
    name: string;
    created_at: string & tags.Format<"date-time">;
    opened_at: string & tags.Format<"date-time">;
    closed_at: string & tags.Format<"date-time">;
  }
}
