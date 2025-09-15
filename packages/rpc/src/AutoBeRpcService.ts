import {
  AutoBeHistory,
  AutoBePhase,
  AutoBeUserMessageContent,
  IAutoBeAgent,
  IAutoBeGetFilesOptions,
  IAutoBeRpcListener,
  IAutoBeRpcService,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
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
export class AutoBeRpcService implements IAutoBeRpcService {
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
  public constructor(private readonly props: AgenticaRpcService.IProps) {
    const { agent, listener } = this.props;
    for (const key of typia.misc.literals<keyof IAutoBeRpcListener>()) {
      if (key === "enable") continue;
      agent.on(key, (event) => {
        listener[key]!(event as any).catch(() => {});
      });
    }
  }

  public async conversate(
    content: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ): Promise<AutoBeHistory[]> {
    if (this.props.onStart) this.props.onStart(content);

    this.props.listener.enable(false).catch(() => {});
    try {
      const result: AutoBeHistory[] =
        await this.props.agent.conversate(content);
      if (this.props.onComplete) this.props.onComplete(result);
      return result;
    } finally {
      this.props.listener.enable(true).catch(() => {});
    }
  }

  public async getFiles(
    options?: Partial<IAutoBeGetFilesOptions>,
  ): Promise<Record<string, string>> {
    return this.props.agent.getFiles(options);
  }

  public async getHistories(): Promise<AutoBeHistory[]> {
    return this.props.agent.getHistories();
  }

  public async getTokenUsage(): Promise<IAutoBeTokenUsageJson> {
    return this.props.agent.getTokenUsage();
  }

  public async getPhase(): Promise<AutoBePhase | null> {
    return this.props.agent.getPhase();
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
  export interface IProps {
    /**
     * AutoBeAgent instance to expose through the RPC service.
     *
     * The core agent that provides vibe coding capabilities including
     * conversation processing, development pipeline orchestration, and artifact
     * generation. This agent's functionality becomes available to remote
     * clients through the RPC service interface while maintaining full feature
     * compatibility.
     */
    agent: IAutoBeAgent;

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

    onStart?: (
      content: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
    ) => void;

    onComplete?: (result: AutoBeHistory[]) => void;
  }
}
