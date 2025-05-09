import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeAnalyzeHistory
  extends AutoBeAgentHistoryBase<"analyze"> {
  content: string;
}
