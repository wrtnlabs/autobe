import { AutoBeUserAudioConversateContent } from "./AutoBeUserAudioConversateContent";
import { AutoBeUserFileConversateContent } from "./AutoBeUserFileConversateContent";
import { AutoBeUserImageConversateContent } from "./AutoBeUserImageConversateContent";
import { AutoBeUserTextConversateContent } from "./AutoBeUserTextConversateContent";

export type AutoBeUserConversateContent =
  | AutoBeUserImageConversateContent
  | AutoBeUserFileConversateContent
  | AutoBeUserTextConversateContent
  | AutoBeUserAudioConversateContent;

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
