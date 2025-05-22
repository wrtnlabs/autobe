import { AutoBeUserMessageContent } from "../histories/contents/AutoBeUserMessageContent";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeUserMessageEvent extends AutoBeEventBase<"userMessage"> {
  contents: AutoBeUserMessageContent[];
}
