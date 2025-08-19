import { AutoBeHistory } from "@autobe/interface";

export interface IOnHistoryAutoBe {
  type: "on_history_auto_be";
  sessionId: string;
  data: AutoBeHistory;
}
