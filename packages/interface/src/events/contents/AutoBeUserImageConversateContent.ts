import { AutoBeUserConversateContentBase } from "./AutoBeUserConversateContentBase";

/**
 * Content type representing image input from users in the conversation.
 *
 * Enables users to share visual references, UI mockups, diagrams, screenshots,
 * or other visual materials as part of their development requirements. Image
 * content supports both base64-encoded image data and URL references, providing
 * flexibility for different use cases and integration scenarios.
 */
export interface AutoBeUserImageConversateContent
  extends AutoBeUserConversateContentBase<"image"> {
  /**
   * Base64 encoded image data.
   *
   * The image data is encoded in Base64 format to ensure safe transmission and
   * storage within the conversate system. This encoding allows the image to be
   * processed by image analysis services and integrated seamlessly into the
   * conversation flow alongside other content types.
   */
  data: string;
}
