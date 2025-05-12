import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";
import { AutoBeUserMessageContent } from "./contents/AutoBeUserMessageContent";

export interface AutoBeUserMessageHistory
  extends AutoBeAgentHistoryBase<"userMessage"> {
  contents: AutoBeUserMessageContent[];
}
