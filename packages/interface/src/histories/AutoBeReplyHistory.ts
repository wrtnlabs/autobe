import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeReplyHistory extends AutoBeAgentHistoryBase<"reply"> {
  text: string;
}
