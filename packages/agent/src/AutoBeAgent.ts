import {
  IAgenticaTokenUsageJson,
  IAgenticaVendor,
  MicroAgentica,
} from "@agentica/core";
import {
  AutoBeAssistantMessageHistory,
  AutoBeHistory,
  AutoBeUserMessageContent,
  AutoBeUserMessageHistory,
  IAutoBeAgent,
  IAutoBeCompilerListener,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { Semaphore, Singleton } from "tstl";
import { v4 } from "uuid";

import { AutoBeAgentBase } from "./AutoBeAgentBase";
import { AutoBeContext } from "./context/AutoBeContext";
import { AutoBeState } from "./context/AutoBeState";
import { AutoBeTokenUsage } from "./context/AutoBeTokenUsage";
import { createAgenticaHistory } from "./factory/createAgenticaHistory";
import { createAutoBeController } from "./factory/createAutoBeApplication";
import { createAutoBeContext } from "./factory/createAutoBeContext";
import { createAutoBeState } from "./factory/createAutoBeState";
import { transformFacadeStateMessage } from "./orchestrate/facade/transformFacadeStateMessage";
import { IAutoBeProps } from "./structures/IAutoBeProps";
import { randomBackoffStrategy } from "./utils/backoffRetry";

/**
 * Main agent class that orchestrates the entire vibe coding pipeline through
 * conversation-driven development.
 *
 * The AutoBeAgent serves as the central coordinator for the waterfall-based
 * development process with spiral model iterative improvements. It manages the
 * five specialized agents (Analyze, Prisma, Interface, Test, Realize) that
 * transform user conversations into complete working applications through a
 * sophisticated AST-based compilation infrastructure.
 *
 * The agent operates through natural language conversation, supporting
 * multimodal input including text, images, files, and audio. It maintains
 * conversation history, tracks development progress through real-time events,
 * and provides access to all generated artifacts including requirements
 * documentation, database schemas, API specifications, test suites, and
 * implementation code.
 *
 * The vibe coding approach eliminates traditional development barriers by
 * enabling users to express requirements naturally while the agent handles all
 * technical implementation details through validated AST transformations and
 * continuous quality assurance feedback loops.
 *
 * @author Samchon
 */
export class AutoBeAgent<Model extends ILlmSchema.Model>
  extends AutoBeAgentBase
  implements IAutoBeAgent
{
  /** @internal */
  private readonly props_: IAutoBeProps<Model>;

  /** @internal */
  private readonly agentica_: MicroAgentica<Model>;

  /** @internal */
  private readonly histories_: AutoBeHistory[];

  /** @internal */
  private readonly context_: AutoBeContext<Model>;

  /** @internal */
  private readonly state_: AutoBeState;

  /** @internal */
  private readonly usage_: AutoBeTokenUsage;

  /* -----------------------------------------------------------
    CONSTRUCTOR
  ----------------------------------------------------------- */
  /**
   * Initializes a new AutoBeAgent instance with the specified configuration.
   *
   * Creates and configures the agent with AI vendor settings, behavioral
   * context (locale/timezone), and compilation infrastructure. The agent can
   * optionally resume from previous conversation histories to continue
   * development sessions or build upon existing work.
   *
   * The constructor sets up the internal MicroAgentica engine, initializes the
   * development state from provided histories, and establishes the event
   * dispatch system for real-time progress notifications. The agent becomes
   * ready for conversation-driven development immediately after construction.
   *
   * @param props Configuration properties including AI vendor settings,
   *   behavioral context, compilation tools, and optional conversation
   *   histories for session continuation
   */
  public constructor(props: IAutoBeProps<Model>) {
    // INITIALIZE MEMBERS
    super({
      compiler: () => this.context_.compiler(),
      state: () => this.state_,
    });
    this.props_ = props;
    this.histories_ = props.histories?.slice() ?? [];
    this.state_ = createAutoBeState(this.histories_);
    this.usage_ =
      props.tokenUsage instanceof AutoBeTokenUsage
        ? props.tokenUsage
        : new AutoBeTokenUsage(props.tokenUsage);

    // CONSTRUCT AGENTICA
    const vendor: IAgenticaVendor = {
      ...props.vendor,
      semaphore: new Semaphore(props.vendor.semaphore ?? 16),
    };
    const compilerListener: IAutoBeCompilerListener = {
      realize: {
        test: {
          onOperation: async () => {},
          onReset: async () => {},
        },
      },
    };
    const compiler = new Singleton(async () =>
      props.compiler(compilerListener),
    );
    this.context_ = createAutoBeContext({
      model: props.model,
      vendor: props.vendor,
      config: {
        backoffStrategy: randomBackoffStrategy,
        ...props.config,
      },
      compiler: () => compiler.get(),
      compilerListener,
      state: () => this.state_,
      files: (options) => this.getFiles(options),
      histories: () => this.histories_,
      usage: () => this.usage_,
      dispatch: (event) => this.dispatch(event),
    });
    this.agentica_ = new MicroAgentica({
      vendor,
      model: props.model,
      config: {
        ...(props.config ?? {}),
        executor: {
          describe: null,
        },
        systemPrompt: {
          execute: () => transformFacadeStateMessage(this.state_),
        },
      },
      controllers: [
        createAutoBeController({
          model: props.model,
          context: this.context_,
        }),
      ],
    });

    // HISTORIES MANIPULATION
    this.agentica_.getHistories().push(
      ...this.histories_
        .map((history) =>
          createAgenticaHistory({
            operations: this.agentica_.getOperations(),
            history,
          }),
        )
        .filter((h) => h !== null),
    );

    // TRACE FACADE TOKEN USAGE
    let previous: IAgenticaTokenUsageJson.IComponent = this.agentica_
      .getTokenUsage()
      .toJSON().aggregate;
    const increment = () => {
      const current: IAgenticaTokenUsageJson.IComponent = this.agentica_
        .getTokenUsage()
        .toJSON().aggregate;
      this.usage_.facade.increment({
        total: current.total - previous.total,
        input: {
          total: current.input.total - previous.input.total,
          cached: current.input.cached - previous.input.cached,
        },
        output: {
          total: current.output.total - previous.output.total,
          reasoning: current.output.reasoning - previous.output.reasoning,
          accepted_prediction:
            current.output.accepted_prediction -
            previous.output.accepted_prediction,
          rejected_prediction:
            current.output.rejected_prediction -
            previous.output.rejected_prediction,
        },
      });
      previous = current;
    };

    // SHIFT EVENTS
    this.agentica_.on("assistantMessage", async (message) => {
      const start = new Date();
      const history: AutoBeAssistantMessageHistory = {
        id: v4(),
        type: "assistantMessage",
        text: await message.join(),
        created_at: start.toISOString(),
        completed_at: new Date().toISOString(),
      };
      increment();
      this.histories_.push(history);
      this.dispatch({
        type: "assistantMessage",
        text: history.text,
        created_at: history.created_at,
      }).catch(() => {});
    });
    this.agentica_.on("call", async () => {
      increment();
    });
    this.agentica_.on("request", (e) => {
      if (e.body.parallel_tool_calls !== undefined)
        delete e.body.parallel_tool_calls;
      void this.dispatch({
        ...e,
        type: "vendorRequest",
        source: "facade",
      }).catch(() => {});
    });
    this.agentica_.on("response", (e) => {
      void this.dispatch({
        ...e,
        type: "vendorResponse",
        source: "facade",
      }).catch(() => {});
    });
  }

  /** @internal */
  public clone(): AutoBeAgent<Model> {
    return new AutoBeAgent<Model>({
      ...this.props_,
      histories: this.histories_.slice(),
    });
  }

  /* -----------------------------------------------------------
    ACCESSORS
  ----------------------------------------------------------- */
  public async conversate(
    content: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ): Promise<AutoBeHistory[]> {
    const index: number = this.histories_.length;
    const userMessageHistory: AutoBeUserMessageHistory = {
      id: v4(),
      type: "userMessage",
      contents:
        typeof content === "string"
          ? [
              {
                type: "text",
                text: content,
              },
            ]
          : Array.isArray(content)
            ? content
            : [content],
      created_at: new Date().toISOString(),
    };
    this.histories_.push(userMessageHistory);
    this.dispatch(userMessageHistory).catch(() => {});

    await this.agentica_.conversate(content);
    return this.histories_.slice(index);
  }

  public getHistories(): AutoBeHistory[] {
    return this.histories_;
  }

  public getTokenUsage(): AutoBeTokenUsage {
    return this.usage_;
  }

  /** @internal */
  public getContext(): AutoBeContext<Model> {
    return this.context_;
  }
}
