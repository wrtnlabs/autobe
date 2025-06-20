import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";
import { AutoBeUserMessageContent } from "./contents/AutoBeUserMessageContent";

/**
 * History record generated when a user sends a message during the conversation
 * flow.
 *
 * User messages support comprehensive multimodal capabilities, allowing not
 * only text input but also image attachments, document file uploads, and voice
 * input. This flexibility enables users to communicate requirements, provide
 * visual references, share existing documentation, and interact naturally
 * through multiple input modalities.
 *
 * The multimodal support enhances the vibe coding experience by allowing users
 * to express their needs through the most appropriate medium, whether that's
 * describing requirements in text, showing examples through images, or
 * providing specifications through document uploads.
 *
 * @author Samchon
 */
export interface AutoBeUserMessageHistory
  extends AutoBeAgentHistoryBase<"userMessage"> {
  /**
   * Array of content items that comprise the user's message.
   *
   * Contains the multimodal content of the user's message, which can include
   * various types of {@link AutoBeUserMessageContent} such as text, images,
   * document files, and audio inputs. Each content item represents a different
   * modality or attachment within the same message.
   *
   * The array structure allows users to combine multiple content types in a
   * single message, such as text description accompanied by reference images or
   * documents. This multimodal approach provides rich context for the AI
   * assistant to better understand user requirements and generate more accurate
   * development artifacts.
   */
  contents: AutoBeUserMessageContent[];
}
