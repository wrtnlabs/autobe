import { MicroAgentica } from "@agentica/core";
import {
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeHistory,
  AutoBeUserMessageContent,
  AutoBeUserMessageHistory,
  IAutoBeGetFilesOptions,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { Semaphore } from "tstl";
import { v4 } from "uuid";

import { AutoBeContext } from "./context/AutoBeContext";
import { AutoBeState } from "./context/AutoBeState";
import { AutoBeTokenUsage } from "./context/AutoBeTokenUsage";
import { createAgenticaHistory } from "./factory/createAgenticaHistory";
import { createAutoBeController } from "./factory/createAutoBeApplication";
import { createAutoBeState } from "./factory/createAutoBeState";
import { transformFacadeStateMessage } from "./orchestrate/facade/transformFacadeStateMessage";
import { IAutoBeProps } from "./structures/IAutoBeProps";
import { emplaceMap } from "./utils/emplaceMap";

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
export class AutoBeAgent<Model extends ILlmSchema.Model> {
  private readonly agentica_: MicroAgentica<Model>;
  private readonly histories_: AutoBeHistory[];
  private readonly context_: AutoBeContext<Model>;

  private readonly state_: AutoBeState;
  private readonly listeners_: Map<
    string,
    Set<(event: AutoBeEvent) => Promise<void> | void>
  >;

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
  public constructor(private readonly props: IAutoBeProps<Model>) {
    this.histories_ = props.histories?.slice() ?? [];
    this.state_ = createAutoBeState(this.histories_);
    this.context_ = {
      model: props.model,
      vendor: props.vendor,
      config: props.config,
      compiler: props.compiler,
      histories: () => this.histories_,
      state: () => this.state_,
      usage: () => this.agentica_.getTokenUsage(),
      files: (options) => this.getFiles(options),
      dispatch: (event) => {
        this.dispatch(event).catch(() => {});
      },
    };
    this.listeners_ = new Map();

    this.agentica_ = new MicroAgentica({
      model: props.model,
      vendor: {
        ...props.vendor,
        semaphore: new Semaphore(props.vendor.semaphore ?? 16),
      },
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
    this.agentica_.on("assistantMessage", async (message) => {
      const start = new Date();
      const history: AutoBeAssistantMessageHistory = {
        id: v4(),
        type: "assistantMessage",
        text: await message.join(),
        created_at: start.toISOString(),
        completed_at: new Date().toISOString(),
      };
      this.histories_.push(history);
      this.dispatch({
        type: "assistantMessage",
        text: history.text,
        created_at: history.created_at,
      }).catch(() => {});
    });
    this.agentica_.on("request", (e) => {
      if (e.body.parallel_tool_calls !== undefined)
        delete e.body.parallel_tool_calls;
    });
  }

  /** @internal */
  public clone(): AutoBeAgent<Model> {
    return new AutoBeAgent<Model>({
      ...this.props,
      histories: this.histories_.slice(),
    });
  }

  /**
   * Registers an event listener for specific development phase events.
   *
   * Enables client applications to receive real-time notifications about
   * conversation flow, development progress, and completion events throughout
   * the vibe coding pipeline. Event listeners provide visibility into agent
   * activities and enable responsive user interfaces that can display progress,
   * handle artifacts, and provide feedback.
   *
   * The type-safe event system ensures that listeners receive properly typed
   * events corresponding to their registration type, enabling robust event
   * handling without runtime type issues. Multiple listeners can be registered
   * for the same event type to support complex notification requirements.
   *
   * @param type Event type to listen for (e.g., "analyzeComplete",
   *   "prismaStart")
   * @param listener Callback function that receives the typed event when fired
   * @returns The agent instance for method chaining
   */
  public on<Type extends AutoBeEvent.Type>(
    type: Type,
    listener: (event: AutoBeEvent.Mapper[Type]) => Promise<void> | void,
  ): this {
    emplaceMap(this.listeners_, type, () => new Set()).add(
      listener as (event: AutoBeEvent) => any,
    );
    return this;
  }

  /**
   * Unregisters a previously registered event listener.
   *
   * Removes the specified event listener from the agent's notification system,
   * stopping further event notifications for that particular listener function.
   * This is useful for cleanup, dynamic listener management, or when components
   * no longer need to receive specific event notifications.
   *
   * The listener function reference must exactly match the function that was
   * originally registered with {@link on} for successful removal. If no matching
   * listener is found, the operation has no effect.
   *
   * @param type Event type the listener was registered for
   * @param listener The exact listener function reference to remove
   * @returns The agent instance for method chaining
   */
  public off<Type extends AutoBeEvent.Type>(
    type: Type,
    listener: (event: AutoBeEvent.Mapper[Type]) => Promise<void> | void,
  ): this {
    const set = this.listeners_.get(type);
    if (set === undefined) return this;

    set.delete(listener as (event: AutoBeEvent) => any);
    if (set.size === 0) this.listeners_.delete(type);
    return this;
  }

  /* -----------------------------------------------------------
    ACCESSORS
  ----------------------------------------------------------- */
  /**
   * Engages in conversation with the agent to drive the vibe coding process.
   *
   * Accepts user input in multiple formats including simple text strings,
   * single multimodal content items, or arrays of content supporting text,
   * images, file uploads, and audio input. The conversation serves as the
   * primary interface for expressing requirements, providing feedback, and
   * guiding the development process through natural language interaction.
   *
   * The agent analyzes the conversation context to determine appropriate
   * actions, potentially activating specialized agents (Analyze, Prisma,
   * Interface, Test, Realize) through function calling based on user needs.
   * Real-time progress events are fired through registered listeners while the
   * conversation processes.
   *
   * Returns all history records generated during this conversation turn,
   * including user messages, assistant responses, and any development
   * activities triggered by the interaction. This enables clients to track both
   * conversational flow and development progress.
   *
   * @param content User input as text, single content item, or multimodal array
   * @returns Promise resolving to array of history records from this
   *   conversation
   */
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

  /**
   * Retrieves all generated files from the current development session.
   *
   * Returns a comprehensive collection of all artifacts generated throughout
   * the vibe coding pipeline including requirements documentation, database
   * schemas with ERD diagrams, OpenAPI specifications, NestJS project files,
   * test suites, implementation code, and metadata. Files are organized with
   * logical directory structure reflecting their purpose and development
   * phase.
   *
   * The file collection includes both source artifacts (schemas,
   * specifications) and generated code (controllers, DTOs, tests, services)
   * ready for immediate use, further customization, or deployment. Additional
   * metadata files provide session information including conversation histories
   * and token usage statistics.
   *
   * @param options Options specifying the DBMS type for code generation
   * @returns Key-value pairs mapping file paths to file contents for all
   *   generated development artifacts
   */
  public async getFiles(
    options?: Partial<IAutoBeGetFilesOptions>,
  ): Promise<Record<string, string>> {
    const files: Record<string, string> = {
      ...Object.fromEntries(
        this.state_.analyze
          ? Object.entries(this.state_.analyze.files).map(([key, value]) => [
              `docs/analysis/${key.split("/").at(-1)}`,
              value,
            ])
          : [],
      ),
      ...Object.fromEntries(
        this.state_.prisma?.result.success === true
          ? [
              ...Object.entries(
                (options?.dbms ?? "postgres") === "postgres"
                  ? this.state_.prisma.schemas
                  : await this.context_.compiler.prisma.write(
                      this.state_.prisma.result.data,
                      options!.dbms!,
                    ),
              ).map(([key, value]) => [
                `prisma/schema/${key.split("/").at(-1)}`,
                value,
              ]),
              ...(this.state_.prisma.compiled.type === "success"
                ? [["docs/ERD.md", this.state_.prisma.compiled.document]]
                : []),
              ...(this.state_.prisma.compiled.type === "failure"
                ? [
                    [
                      "prisma/compile-error-reason.log",
                      this.state_.prisma.compiled.reason,
                    ],
                  ]
                : []),
              [
                "autobe/prisma.json",
                JSON.stringify(this.state_.prisma.result.data, null, 2),
              ],
            ]
          : [],
      ),
      ...(this.state_.interface ? this.state_.interface.files : {}),
      ...(this.state_.test?.compiled.type === "success"
        ? this.state_.test.files
        : {}),
      ...(this.state_.realize?.compiled.type === "success"
        ? this.state_.realize.files
        : {}),
      "autobe/histories.json": JSON.stringify(this.histories_, null, 2),
      "autobe/tokenUsage.json": JSON.stringify(this.getTokenUsage(), null, 2),
      ...(this.state_.interface
        ? {
            "autobe/document.json": JSON.stringify(
              this.state_.interface.document,
              null,
              2,
            ),
          }
        : {}),
    };
    return Object.fromEntries(
      Object.entries(files).map(([k, v]) => [
        k.startsWith("/") ? k.substring(1) : k,
        v,
      ]),
    );
  }

  /**
   * Retrieves the complete conversation and development history.
   *
   * Returns the chronologically ordered record of all events from the current
   * session including user messages, assistant responses, development phase
   * activities, progress events, and completion notifications. This
   * comprehensive history enables conversation replay, development process
   * analysis, and understanding of how requirements evolved into working
   * software.
   *
   * The history provides complete transparency into the vibe coding process,
   * showing both conversational interactions and behind-the-scenes development
   * activities. This information is valuable for debugging, process
   * improvement, and educational purposes to understand the agent's
   * decision-making process.
   *
   * @returns Chronologically ordered array of all history records including
   *   messages, events, and development activities
   */
  public getHistories(): AutoBeHistory[] {
    return this.histories_;
  }

  /**
   * Retrieves comprehensive AI token usage statistics for the current session.
   *
   * Returns detailed breakdown of token consumption across all specialized
   * agents and processing phases, enabling cost monitoring, performance
   * analysis, and optimization of AI resource utilization. Statistics include
   * aggregate totals and component-specific breakdowns with input/output
   * categorization, caching analysis, and reasoning token tracking.
   *
   * Token usage data is essential for understanding the computational costs of
   * different development phases and optimizing AI efficiency. The breakdown
   * helps identify which agents or operations consume the most resources,
   * enabling targeted optimization efforts while maintaining development
   * quality.
   *
   * @returns Comprehensive token usage statistics with detailed breakdowns by
   *   agent, operation type, and consumption category
   */
  public getTokenUsage(): AutoBeTokenUsage {
    return this.agentica_.getTokenUsage();
  }

  /* -----------------------------------------------------------
    CONTEXTS
  ----------------------------------------------------------- */
  /** @internal */
  public getContext(): AutoBeContext<Model> {
    return this.context_;
  }

  /** @internal */
  private async dispatch(event: AutoBeEvent): Promise<void> {
    const set = this.listeners_.get(event.type);
    if (set === undefined) return;
    await Promise.all(
      Array.from(set).map(async (listener) => {
        try {
          await listener(event);
        } catch {}
      }),
    );
  }
}
