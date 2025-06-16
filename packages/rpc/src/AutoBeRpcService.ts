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

export class AutoBeRpcService<Model extends ILlmSchema.Model>
  implements IAutoBeRpcService
{
  public constructor(private readonly props: AgenticaRpcService.IProps<Model>) {
    const { agent, listener } = this.props;
    for (const key of typia.misc.literals<keyof IAutoBeRpcListener>())
      agent.on(key, (event) => {
        listener[key]!(event as any).catch(() => {});
      });
  }

  public conversate(
    content: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ): Promise<AutoBeHistory[]> {
    return this.props.agent.conversate(content);
  }

  public async getFiles(): Promise<Record<string, string>> {
    return this.props.agent.getFiles();
  }

  public async getHistories(): Promise<AutoBeHistory[]> {
    return this.props.agent.getHistories();
  }

  public async getTokenUsage(): Promise<IAutoBeTokenUsageJson> {
    return this.props.agent.getTokenUsage().toJSON();
  }
}
export namespace AgenticaRpcService {
  /** Properties of the {@link AgenticaRpcService}. */
  export interface IProps<Model extends ILlmSchema.Model> {
    /** Target agent to provide as RPC service. */
    agent: AutoBeAgent<Model>;

    /** Listener to be binded on the agent. */
    listener: IAutoBeRpcListener;
  }
}
