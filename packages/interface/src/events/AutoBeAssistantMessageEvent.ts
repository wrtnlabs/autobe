import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeAssistantMessageEvent
  extends AutoBeEventBase<"assistantMessage"> {
  text: string;
}
