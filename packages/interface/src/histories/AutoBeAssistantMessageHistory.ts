import { tags } from "typia";

import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

/**
 * History record generated when the AI assistant sends a message to the user
 * during the conversation flow.
 *
 * The assistant communicates exclusively through text messages, providing
 * responses to user queries, explanations of development processes, progress
 * updates, and guidance throughout the vibe coding workflow. Unlike user
 * messages which support multimodal content, assistant messages are limited to
 * text-only communication.
 *
 * These message histories serve as a complete record of the assistant's
 * contributions to the conversation, enabling conversation replay, context
 * understanding, and interaction analysis for improving the development
 * experience.
 *
 * @author Samchon
 */
export interface AutoBeAssistantMessageHistory
  extends AutoBeAgentHistoryBase<"assistantMessage"> {
  /**
   * The text content of the assistant's message.
   *
   * Contains the complete text response from the AI assistant, which may
   * include explanations, progress updates, development guidance, error
   * descriptions, or answers to user questions. The assistant uses this text
   * communication to guide users through the development process and provide
   * context about ongoing operations.
   *
   * Unlike user messages that support various content types (text, images,
   * files, audio), assistant responses are constrained to text-only format for
   * consistency and clarity in the conversation flow.
   */
  text: string;

  /**
   * ISO 8601 timestamp indicating when the assistant message was completed.
   *
   * Marks the exact moment when the AI assistant finished generating and
   * sending the response message. This timestamp is essential for maintaining
   * proper conversation chronology, tracking response times, and understanding
   * the temporal flow of the development conversation.
   */
  completed_at: string & tags.Format<"date-time">;
}
