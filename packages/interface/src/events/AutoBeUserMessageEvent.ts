import { AutoBeUserMessageContent } from "../histories/contents/AutoBeUserMessageContent";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when a user sends a message during the conversation flow.
 *
 * This event represents real-time user input in the vibe coding conversation,
 * capturing the multimodal communication from users that drives the development
 * process. User messages can include text descriptions, visual references,
 * document uploads, and voice input that provide the requirements, feedback,
 * and guidance necessary for the AI agents to generate accurate software
 * solutions.
 *
 * The user message events serve as the primary input source for the entire vibe
 * coding pipeline, enabling users to express their needs through multiple
 * modalities and maintain interactive control over the automated development
 * process as it progresses through different phases.
 *
 * @author Samchon
 */
export interface AutoBeUserMessageEvent extends AutoBeEventBase<"userMessage"> {
  /**
   * Array of multimodal content items that comprise the user's message.
   *
   * Contains the diverse {@link AutoBeUserMessageContent} elements that make up
   * the user's communication, which can include text descriptions, images for
   * visual references, document files for specifications, and audio for voice
   * input. Each content item represents a different modality or attachment
   * within the same message.
   *
   * The multimodal array structure allows users to combine multiple content
   * types in a single message, such as text requirements accompanied by
   * reference images or documents. This comprehensive input approach provides
   * rich context for the AI agents to better understand user intentions and
   * generate more accurate development artifacts throughout the vibe coding
   * process.
   */
  contents: AutoBeUserMessageContent[];
}
