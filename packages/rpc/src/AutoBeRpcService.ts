import { AutoBeAgent } from "@autobe/agent";
import {
  AutoBeHistory,
  AutoBeUserMessageContent,
  IAutoBeRpcListener,
  IAutoBeRpcService,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import typia from "typia";

/**
 * WebSocket RPC service implementation that wraps AutoBeAgent for remote
 * access.
 *
 * This class serves as the WebSocket RPC Provider in TGrid's paradigm, exposing
 * AutoBeAgent functionality to remote client applications through type-safe
 * WebSocket connections. It implements the {@link IAutoBeRpcService} interface
 * to provide standardized remote procedure call access to the vibe coding
 * pipeline.
 *
 * The service automatically bridges all agent events to the client's event
 * listener, ensuring that remote clients receive real-time progress
 * notifications throughout the development process. This enables responsive
 * user interfaces that can display progress, handle artifacts, and provide
 * feedback during the automated development workflow.
 *
 * By wrapping the AutoBeAgent, this service transforms local agent capabilities
 * into a distributed system component that supports multiple concurrent client
 * connections while maintaining the full functionality and event transparency
 * of the underlying vibe coding system.
 *
 * @author Samchon
 */
export class AutoBeRpcService<Model extends ILlmSchema.Model>
  implements IAutoBeRpcService
{
  /**
   * Initializes the RPC service with an AutoBeAgent and client event listener.
   *
   * Creates the service wrapper around the provided AutoBeAgent and establishes
   * automatic event forwarding to the client's listener. All agent events are
   * automatically registered and forwarded to ensure the remote client receives
   * comprehensive real-time updates about conversation flow, development
   * progress, and completion events.
   *
   * The event bridging is established during construction and remains active
   * throughout the service lifetime, providing seamless integration between the
   * local agent's event system and the remote client's notification handlers.
   *
   * @param props Configuration containing the agent instance and client
   *   listener
   */
  public constructor(private readonly props: AgenticaRpcService.IProps<Model>) {
    const { agent, listener } = this.props;
    for (const key of typia.misc.literals<keyof IAutoBeRpcListener>())
      agent.on(key, (event) => {
        listener[key]!(event as any).catch(() => {});
      });
  }

  /**
   * Forwards conversation requests to the underlying AutoBeAgent.
   *
   * Provides remote access to the agent's conversation capability, accepting
   * user input in various formats including text strings, single multimodal
   * content items, or arrays of content supporting text, images, files, and
   * audio. The conversation drives the vibe coding process remotely while
   * maintaining full functionality of the local agent.
   *
   * Real-time progress events are automatically forwarded to the client through
   * the established event bridge, ensuring remote clients receive the same
   * visibility into development activities as local agent users.
   *
   * @param content User input as text, single content item, or multimodal array
   * @returns Promise resolving to array of history records from this
   *   conversation
   */
  public conversate(
    content: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ): Promise<AutoBeHistory[]> {
    return this.props.agent.conversate(content);
  }

  /**
   * Retrieves all generated files from the agent's development session.
   *
   * Provides remote access to the comprehensive collection of all artifacts
   * generated throughout the vibe coding pipeline including requirements
   * documentation, database schemas, API specifications, test suites, and
   * implementation code. Files are organized with logical directory structure
   * ready for download or further processing by client applications.
   *
   * @returns Promise resolving to key-value pairs mapping file paths to
   *   contents
   */
  public async getFiles(): Promise<Record<string, string>> {
    return this.props.agent.getFiles();
  }

  /**
   * Retrieves the complete conversation and development history from the agent.
   *
   * Provides remote access to the chronologically ordered record of all events
   * from the agent's session including user messages, assistant responses,
   * development activities, and completion events. This enables remote clients
   * to access complete session information for analysis, replay, or archival
   * purposes.
   *
   * @returns Promise resolving to chronologically ordered array of all history
   *   records
   */
  public async getHistories(): Promise<AutoBeHistory[]> {
    return this.props.agent.getHistories();
  }

  /**
   * Retrieves comprehensive AI token usage statistics from the agent.
   *
   * Provides remote access to detailed breakdown of token consumption across
   * all development phases, enabling cost monitoring and performance analysis
   * from client applications. The statistics are serialized to JSON format for
   * efficient transmission over the WebSocket connection.
   *
   * @returns Promise resolving to comprehensive token usage statistics in JSON
   *   format
   */
  public async getTokenUsage(): Promise<IAutoBeTokenUsageJson> {
    return this.props.agent.getTokenUsage().toJSON();
  }
}

export namespace AgenticaRpcService {
  /**
   * Configuration properties for initializing the AutoBeRpcService.
   *
   * Defines the required components for creating a WebSocket RPC service that
   * exposes AutoBeAgent functionality to remote clients. The configuration
   * establishes both the underlying agent capabilities and the event forwarding
   * mechanism necessary for real-time client notifications.
   *
   * @author Samchon
   */
  export interface IProps<Model extends ILlmSchema.Model> {
    /**
     * AutoBeAgent instance to expose through the RPC service.
     *
     * The core agent that provides vibe coding capabilities including
     * conversation processing, development pipeline orchestration, and artifact
     * generation. This agent's functionality becomes available to remote
     * clients through the RPC service interface while maintaining full feature
     * compatibility.
     */
    agent: AutoBeAgent<Model>;

    /**
     * Client event listener for receiving agent events.
     *
     * The remote client's event listener implementation that will receive all
     * agent events including conversation flow, development progress, and
     * completion notifications. The service automatically forwards all agent
     * events to this listener to ensure comprehensive real-time visibility for
     * the remote client.
     */
    listener: IAutoBeRpcListener;
  }
}
