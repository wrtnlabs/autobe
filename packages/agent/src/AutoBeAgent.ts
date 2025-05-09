import { MicroAgentica } from "@agentica/core";
import { AutoBeConversateContent, AutoBeHistory } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeContext } from "./context/AutoBeContext";
import { AutoBeState } from "./context/AutoBeState";
import { AutoBeTokenUsage } from "./context/AutoBeTokenUsage";
import { createAutoBeController } from "./internal/createAutoBeApplication";
import { createAutoBeState } from "./internal/createAutoBeState";
import { transformToAgenticaHistory } from "./internal/transformToAgenticaHistory";
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
    this.context_ = {
      model: props.model,
      vendor: props.vendor,
      usage: () => this.agentica_.getTokenUsage(),
      state: () => this.state_,
    };
    this.histories_ = props.histories?.slice() ?? [];
    this.state_ = createAutoBeState(this.histories_);

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
          transformToAgenticaHistory({
            operations: this.agentica_.getOperations(),
            history,
          }),
        )
        .filter((h) => h !== null),
    );
  }

  /**
   * @internal
   */
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
    content: string | AutoBeConversateContent | AutoBeConversateContent[],
  ): Promise<AutoBeHistory[]> {
    content;
    return [];
  }

  public getHistories(): AutoBeHistory[] {
    return this.histories_;
  }

  public getTokenUsage(): AutoBeTokenUsage {
    return this.agentica_.getTokenUsage();
  }
}
