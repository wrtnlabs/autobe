import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeAssistantMessageHistory
  extends AutoBeAgentHistoryBase<"assistantMessage"> {
  text: string;
}
