import { tags } from "typia";

import { AutoBeEventSnapshot } from "../events/AutoBeEventSnapshot";
import { AutoBeHistory } from "../histories/AutoBeHistory";
import { IAutoBeTokenUsageJson } from "../json/IAutoBeTokenUsageJson";
import { AutoBeHackathonModel } from "./AutoBeHackathonModel";
import { IAutobeHackathonParticipant } from "./IAutobeHackathonParticipant";

export interface IAutoBeHackathonSession
  extends IAutoBeHackathonSession.ISummary {
  histories: AutoBeHistory[];
  event_snapshots: AutoBeEventSnapshot[];
}
export namespace IAutoBeHackathonSession {
  export interface ISummary {
    id: string;
    participant: IAutobeHackathonParticipant;
    title: string | null;
    model: AutoBeHackathonModel;
    timezone: string;
    state: null | "analyze" | "prisma" | "interface" | "test" | "realize";
    review_article_url: null | (string & tags.Format<"uri">);
    token_usage: IAutoBeTokenUsageJson;
    created_at: string & tags.Format<"date-time">;
    completed_at: null | (string & tags.Format<"date-time">);
  }

  export interface ICreate {
    model: AutoBeHackathonModel;
    timezone: string;
    title?: string | null;
  }
  export interface IUpdate {
    title: string | null;
  }
  export interface IReview {
    review_article_url: null | (string & tags.Format<"uri">);
  }

  export interface IHeader {
    Authorization: string;
  }
}
