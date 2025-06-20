import { AutoBeHistory } from "../histories/AutoBeHistory";
import { AutoBeUserMessageContent } from "../histories/contents/AutoBeUserMessageContent";
import { IAutoBeTokenUsageJson } from "../json/IAutoBeTokenUsageJson";

/**
 * Interface representing the WebSocket RPC service provided by the vibe coding
 * server to client applications.
 *
 * This interface defines the remote procedure call functions that client
 * applications can invoke on the vibe coding server through WebSocket
 * connections. The service enables interactive conversation-driven development
 * where users can communicate requirements through multiple modalities and
 * receive comprehensive development artifacts as responses.
 *
 * In TGrid's RPC paradigm, this service acts as the Provider that the server
 * exposes to clients, allowing remote function calls that drive the entire vibe
 * coding pipeline from requirements gathering through final implementation.
 * Client applications obtain a `Driver<IAutoBeRpcService>` instance to call
 * these functions remotely while receiving real-time progress events through
 * the {@link IAutoBeRpcListener}.
 *
 * @author Samchon
 */
export interface IAutoBeRpcService {
  /**
   * Initiates or continues conversation with the vibe coding AI assistant.
   *
   * Accepts user input in various formats including simple text, single content
   * items, or arrays of multimodal content (text, images, files, audio). The
   * conversation drives the entire vibe coding process, with the AI assistant
   * analyzing requirements, making decisions about which development phases to
   * execute, and coordinating the automated development pipeline.
   *
   * This function returns the complete history of events generated during the
   * conversation turn, allowing clients to access both the conversation flow
   * and any development artifacts produced. Real-time progress events are
   * delivered separately through the {@link IAutoBeRpcListener} interface for
   * responsive user experience.
   *
   * @param content User input content supporting text strings, single content
   *   items, or arrays of multimodal content elements
   * @returns Promise resolving to array of history records representing all
   *   events and artifacts generated during this conversation turn
   */
  conversate(
    content: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ): Promise<AutoBeHistory[]>;

  /**
   * Retrieves all generated files from the current vibe coding session.
   *
   * Returns a comprehensive collection of all files generated throughout the
   * vibe coding pipeline including requirements documentation, database
   * schemas, API specifications, test suites, and implementation code. This
   * provides clients with immediate access to all development artifacts without
   * needing to track individual completion events.
   *
   * The returned files represent the complete output of the automated
   * development process, ready for download, further customization, or
   * deployment. File paths maintain the logical organization structure
   * established during generation.
   *
   * @returns Promise resolving to key-value pairs where keys are file paths and
   *   values are file contents for all generated artifacts
   */
  getFiles(): Promise<Record<string, string>>;

  /**
   * Retrieves the complete conversation and development history.
   *
   * Returns the full chronological record of all events that occurred during
   * the vibe coding session including user messages, assistant responses,
   * development phase activities, and completion events. This comprehensive
   * history enables conversation replay, progress analysis, and understanding
   * of the development decision-making process.
   *
   * The history includes both message-level interactions and development-level
   * events, providing complete transparency into how user requirements were
   * transformed into working software through the vibe coding pipeline.
   *
   * @returns Promise resolving to chronologically ordered array of all history
   *   records from the current session
   */
  getHistories(): Promise<AutoBeHistory[]>;

  /**
   * Retrieves comprehensive token usage statistics for the current session.
   *
   * Returns detailed breakdown of AI token consumption across all agents and
   * processing phases, enabling cost monitoring, performance analysis, and
   * optimization of AI resource utilization. The statistics include both
   * aggregate totals and component-specific breakdowns with input/output
   * categorization and caching analysis.
   *
   * Token usage data is essential for understanding the computational costs of
   * the vibe coding process and optimizing AI efficiency while maintaining
   * high-quality output across requirements analysis, database design, API
   * specification, testing, and implementation phases.
   *
   * @returns Promise resolving to comprehensive token usage statistics with
   *   detailed breakdowns by agent, operation type, and usage category
   */
  getTokenUsage(): Promise<IAutoBeTokenUsageJson>;
}
