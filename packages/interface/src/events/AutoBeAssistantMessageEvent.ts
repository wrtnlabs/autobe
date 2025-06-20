import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the AI assistant sends a message to the user during the
 * conversation.
 *
 * This event represents real-time communication from the assistant to the user,
 * providing responses to queries, explanations of development processes,
 * progress updates, and guidance throughout the vibe coding workflow. The
 * assistant uses these messages to maintain clear communication and ensure
 * users understand what is happening during the automated development process.
 *
 * Unlike user messages which support multimodal content, assistant messages are
 * exclusively text-based, focusing on clear and precise communication that
 * guides users through the development experience and provides necessary
 * context about ongoing operations and next steps.
 *
 * @author Samchon
 */
export interface AutoBeAssistantMessageEvent
  extends AutoBeEventBase<"assistantMessage"> {
  /**
   * The text content of the assistant's message to the user.
   *
   * Contains the complete text response from the AI assistant, which may
   * include explanations of current activities, progress updates on development
   * phases, answers to user questions, guidance for next steps, error
   * descriptions, or clarification requests. The message content is designed to
   * keep users informed and engaged throughout the vibe coding process.
   *
   * The text communication serves as the primary interface for the assistant to
   * provide context, explain complex processes in understandable terms, and
   * maintain a collaborative atmosphere during the automated development
   * workflow.
   */
  text: string;
}
