import { AutoBeUserMessageContentBase } from "./AutoBeUserMessageContentBase";

/**
 * Content type representing audio input from users in the conversation.
 *
 * Enables natural voice interaction by allowing users to communicate
 * requirements, ask questions, and provide specifications through spoken input.
 * Voice input enhances the vibe coding experience by providing a more natural
 * and efficient way to express complex requirements, especially when describing
 * workflows, business processes, or detailed specifications.
 *
 * The audio content is processed through speech-to-text capabilities, allowing
 * the AI assistant to understand and respond to voice-based requirements just
 * as effectively as text input. This multimodal approach makes the development
 * conversation more accessible and user-friendly.
 *
 * @author Samchon
 */
export interface AutoBeUserMessageAudioContent
  extends AutoBeUserMessageContentBase<"audio"> {
  /**
   * Base64 encoded audio data containing the user's voice input.
   *
   * The audio data is encoded in Base64 format to ensure safe transmission and
   * storage within the message system. This encoding allows the voice input to
   * be processed by speech-to-text services and integrated seamlessly into the
   * conversation flow alongside other content types.
   *
   * The encoded audio maintains the original quality necessary for accurate
   * speech recognition while being compatible with standard data transmission
   * and storage protocols.
   */
  data: string;

  /**
   * The format of the encoded audio data.
   *
   * Specifies the audio codec and container format used for the voice input.
   * Currently supports "wav" for uncompressed high-quality audio and "mp3" for
   * compressed audio with smaller file sizes. The format information ensures
   * proper decoding and processing of the audio content.
   *
   * Different formats may be preferred based on quality requirements, file size
   * constraints, and compatibility with speech recognition services.
   */
  format: "wav" | "mp3";
}
