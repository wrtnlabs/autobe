import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeAnalyzeHistory
  extends AutoBeAgentHistoryBase<"analyze"> {
  files: Record<string, string>;
  reason: string;
  description: string;
}
