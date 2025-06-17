import { MicroAgentica } from "@agentica/core";
import {
  AutoBeAssistantMessageHistory,
  AutoBeEvent,
  AutoBeHistory,
  AutoBeUserMessageContent,
  AutoBeUserMessageHistory,
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
   * Initializer constructor.
   *
   * @param props Properties to construct the agent
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
      files: () => this.getFiles(),
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

  public on<Type extends AutoBeEvent.Type>(
    type: Type,
    listener: (event: AutoBeEvent.Mapper[Type]) => Promise<void> | void,
  ): this {
    emplaceMap(this.listeners_, type, () => new Set()).add(
      listener as (event: AutoBeEvent) => any,
    );
    return this;
  }

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

  public getFiles(): Record<string, string> {
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
              ...Object.entries(this.state_.prisma.schemas).map(
                ([key, value]) => [
                  `prisma/schema/${key.split("/").at(-1)}`,
                  value,
                ],
              ),
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

  public getHistories(): AutoBeHistory[] {
    return this.histories_;
  }

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
