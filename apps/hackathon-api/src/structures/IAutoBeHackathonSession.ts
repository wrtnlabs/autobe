import {
  AutoBeEventSnapshot,
  AutoBeHistory,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { tags } from "typia";

import { IAutobeHackathonParticipant } from "./IAutobeHackathonParticipant";

export interface IAutoBeHackathonSession
  extends IAutoBeHackathonSession.ISummary {
  histories: AutoBeHistory[];
  event_snapshots: AutoBeEventSnapshot[];
}
export namespace IAutoBeHackathonSession {
  export interface ISummary {
    id: string;
    model: string;
    participant: IAutobeHackathonParticipant;
    state: null | "analyze" | "prisma" | "interface" | "test" | "realize";
    review_article_url: null | (string & tags.Format<"uri">);
    token_usage: IAutoBeTokenUsageJson;
    created_at: string & tags.Format<"date-time">;
    completed_at: null | (string & tags.Format<"date-time">);
  }
  export interface IReview {
    review_article_url: null | (string & tags.Format<"uri">);
  }

  export interface IStartHeader {
    Authorization: string;
    model:
      | "qwen/qwen3-235b-a22b-2507"
      | "openai/gpt-4.1-mini"
      | "openai/gpt-4.1";
  }
  export interface IRestartHeader {
    Authorization: string;
  }
  export interface IReplayHeader {
    Authorization: string;
  }
}
