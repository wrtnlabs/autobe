import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeRealizeHistory
  extends AutoBeAgentHistoryBase<"realize"> {
  files: Record<string, string>;
}
