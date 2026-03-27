import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeUserConversateContent } from "./contents/AutoBeUserConversateContent";

/**
 * Event fired when a user sends a message during the conversation flow.
 *
 * @author Samchon
 */
export interface AutoBeUserMessageEvent extends AutoBeEventBase<"userMessage"> {
  /** Multimodal content items (text, images, documents, audio). */
  contents: AutoBeUserConversateContent[];
}
