import { IAutoBeTokenUsageJson } from "@autobe/interface";

export interface IOnEventUpdateTokenUsage {
  type: "on_event_update_token_usage";
  sessionId: string;
  data: IAutoBeTokenUsageJson;
}
