import { AutoBeUserMessageAudioContent } from "./AutoBeUserMessageAudioContent";
import { AutoBeUserMessageFileContent } from "./AutoBeUserMessageFileContent";
import { AutoBeUserMessageImageContent } from "./AutoBeUserMessageImageContent";
import { AutoBeUserMessageTextContent } from "./AutoBeUserMessageTextContent";

/**
 * Union type representing all possible content types within a user message.
 *
 * This comprehensive multimodal union enables users to communicate through
 * various input modalities including text descriptions, visual references
 * through images, documentation through file uploads, and natural voice
 * interaction through audio. The multimodal approach enhances the vibe coding
 * experience by allowing users to express requirements using the most
 * appropriate medium for their needs.
 *
 * Each content type is designed to provide rich context to the AI assistant,
 * enabling more accurate understanding of user requirements and generating
 * better development artifacts. Users can combine multiple content types within
 * a single message to provide comprehensive specification of their needs.
 *
 * @author Samchon
 */
export type AutoBeUserMessageContent =
  | AutoBeUserMessageAudioContent
  | AutoBeUserMessageFileContent
  | AutoBeUserMessageImageContent
  | AutoBeUserMessageTextContent;

export namespace AutoBeUserMessageContent {
  /**
   * Type alias for extracting the discriminator union from user message content
   * types.
   *
   * Provides a convenient way to reference all possible content type values
   * including "audio", "file", "image", and "text". This type is essential for
   * type guards, content processing logic, and multimodal input handling
   * throughout the conversation system.
   */
  export type Type = AutoBeUserMessageContent["type"];

  /**
   * Type mapping interface that associates each content type string with its
   * corresponding content interface.
   *
   * Enables type-safe processing of different content modalities based on their
   * discriminator values. This mapper facilitates robust multimodal content
   * handling, ensuring that each content type is processed according to its
   * specific characteristics and requirements in the vibe coding pipeline.
   *
   * The mapper provides compile-time type safety when working with
   * heterogeneous content arrays and enables efficient content type-specific
   * processing logic.
   */
  export interface Mapper {
    audio: AutoBeUserMessageAudioContent;
    file: AutoBeUserMessageFileContent;
    image: AutoBeUserMessageImageContent;
    text: AutoBeUserMessageTextContent;
  }
}
