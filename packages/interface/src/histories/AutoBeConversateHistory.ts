import { AutoBeConversateContent } from "../contents/AutoBeConversateContent";
import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

export interface AutoBeConversateHistory
  extends AutoBeAgentHistoryBase<"conversate"> {
  contents: AutoBeConversateContent[];
}
