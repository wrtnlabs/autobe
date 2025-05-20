import { MicroAgentica } from "@agentica/core";
import { AutoBeHistory, AutoBeUserMessageContent } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "./context/AutoBeContext";
import { AutoBeState } from "./context/AutoBeState";
import { AutoBeTokenUsage } from "./context/AutoBeTokenUsage";
import { createAgenticaHistory } from "./factory/createAgenticaHistory";
import { createAutoBeController } from "./factory/createAutoBeApplication";
import { createAutoBeState } from "./factory/createAutoBeState";
import { IAutoBeProps } from "./structures/IAutoBeProps";

export class AutoBeAgent<Model extends ILlmSchema.Model> {
  private readonly agentica_: MicroAgentica<Model>;
  private readonly histories_: AutoBeHistory[];
  private readonly context_: AutoBeContext<Model>;
  private readonly state_: AutoBeState;

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
    };

    this.agentica_ = new MicroAgentica({
      model: props.model,
      vendor: props.vendor,
      config: {
        ...(props.config ?? {}),
        executor: {
          describe: null,
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
  }

  /** @internal */
  public clone(): AutoBeAgent<Model> {
    return new AutoBeAgent<Model>({
      ...this.props,
      histories: this.histories_.slice(),
    });
  }

  /* -----------------------------------------------------------
    ACCESSORS
  ----------------------------------------------------------- */
  public async conversate(
    content: string | AutoBeUserMessageContent | AutoBeUserMessageContent[],
  ): Promise<AutoBeHistory[]> {
    content;
    return [];
  }

  public getFiles(): Record<string, string> {
    return {
      ...Object.fromEntries(
        this.state_.analyze
          ? Object.entries(this.state_.analyze.files).map(([key, value]) => [
              `docs/analysis/${key.split("/").at(-1)}`,
              value,
            ])
          : [],
      ),
      ...Object.fromEntries(
        this.state_.prisma?.result.type === "success"
          ? [
              ...Object.entries(this.state_.prisma.result.schemas).map(
                ([key, value]) => [
                  `prisma/schema/${key.split("/").at(-1)}`,
                  value,
                ],
              ),
              ["docs/ERD.md", this.state_.prisma.result.document],
            ]
          : [],
      ),
      ...(this.state_.interface ? this.state_.interface.files : {}),
      ...(this.state_.test?.result.type === "success"
        ? this.state_.test.files
        : {}),
      ...(this.state_.realize?.result.type === "success"
        ? this.state_.realize.files
        : {}),
    };
  }

  public getHistories(): AutoBeHistory[] {
    return this.histories_;
  }

  public getTokenUsage(): AutoBeTokenUsage {
    return this.agentica_.getTokenUsage();
  }

  /** @internal */
  public getContext(): AutoBeContext<Model> {
    return this.context_;
  }
}
