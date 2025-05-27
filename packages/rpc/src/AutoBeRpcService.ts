import { AutoBeAgent } from "@autobe/agent";
import {
  AutoBeHistory,
  AutoBeUserMessageContent,
  IAutoBeRpcListener,
  IAutoBeRpcService,
  IAutoBeTokenUsageJson,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

export class AutoBeRpcService<Model extends ILlmSchema.Model>
  implements IAutoBeRpcService
{
  public constructor(private readonly props: AgenticaRpcService.IProps<Model>) {
    const { agent, listener } = this.props;

    // MESSAGES
    agent.on("assistantMessage", (event) => {
      listener.assistantMessage(event).catch(() => {});
    });
    agent.on("userMessage", (event) => {
      listener.userMessage!(event).catch(() => {});
    });

    // ANALYZE
    agent.on("analyzeStart", (event) => {
      listener.analyzeStart!(event).catch(() => {});
    });
    agent.on("analyzeWriteDocument", (event) => {
      listener.analyzeWriteDocument!(event).catch(() => {});
    });
    agent.on("analyzeReview", (event) => {
      listener.analyzeReview!(event).catch(() => {});
    });
    agent.on("analyzeComplete", (event) => {
      listener.analyzeComplete!(event).catch(() => {});
    });

    // PRISMA
    agent.on("prismaStart", (event) => {
      listener.prismaStart!(event).catch(() => {});
    });
    agent.on("prismaComponents", (event) => {
      listener.prismaComponents!(event).catch(() => {});
    });
    agent.on("prismaSchemas", (event) => {
      listener.prismaSchemas!(event).catch(() => {});
    });
    agent.on("prismaComplete", (event) => {
      listener.prismaComplete!(event).catch(() => {});
    });
    agent.on("prismaValidate", (event) => {
      listener.prismaValidate!(event).catch(() => {});
    });

    // INTERFACE
    agent.on("interfaceStart", (event) => {
      listener.interfaceStart!(event).catch(() => {});
    });
    agent.on("interfaceEndpoints", (event) => {
      listener.interfaceEndpoints!(event).catch(() => {});
    });
    agent.on("interfaceOperations", (event) => {
      listener.interfaceOperations!(event).catch(() => {});
    });
    agent.on("interfaceComponents", (event) => {
      listener.interfaceComponents!(event).catch(() => {});
    });
    agent.on("interfaceComplete", (event) => {
      listener.interfaceComplete!(event).catch(() => {});
    });

    // TEST
    agent.on("testStart", (event) => {
      listener.testStart!(event).catch(() => {});
    });
    agent.on("testComplete", (event) => {
      listener.testComplete!(event).catch(() => {});
    });

    // REALIZE
    agent.on("realizeStart", (event) => {
      listener.realizeStart!(event).catch(() => {});
    });
    agent.on("realizeComplete", (event) => {
      listener.realizeComplete!(event).catch(() => {});
    });
  }

  public conversate(
    content: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ): Promise<AutoBeHistory[]> {
    return this.props.agent.conversate(content);
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
