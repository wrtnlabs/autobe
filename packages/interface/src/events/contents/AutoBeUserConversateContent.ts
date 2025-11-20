import {
  AutoBeUserMessageAudioContent,
  AutoBeUserMessageFileContent,
  AutoBeUserMessageTextContent,
} from "../../histories";
import { AutoBeUserImageConversateContent } from "./AutoBeUserImageConversateContent";

export type AutoBeUserConversateContent =
  | AutoBeUserImageConversateContent
  | AutoBeUserMessageFileContent
  | AutoBeUserMessageTextContent
  | AutoBeUserMessageAudioContent;

export namespace AutoBeUserConversateContent {
  /**
   * Type alias for extracting the discriminator union from user conversate
   * content types.
   *
   * Provides a convenient way to reference all possible content type values
   * including "image", "file", "text", and "audio". This type is essential for
   * type guards, content processing logic, and multimodal input handling
   * throughout the conversation system.
   */
  export type Type = AutoBeUserConversateContent["type"];
}
