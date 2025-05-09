import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeTestHistory extends AutoBeAgentHistoryBase<"test"> {
  files: Record<string, string>;
}
