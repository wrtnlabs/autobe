import { Agentica } from "@agentica/core";
import { AutoBeConversateContent, AutoBeHistory } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeTokenUsage } from "./context/AutoBeTokenUsage";
import { IAutoBeProps } from "./structures/IAutoBeProps";

export class AutoBeAgent<Model extends ILlmSchema.Model> {
  private readonly agentica_: Agentica<Model>;
  private readonly histories_: AutoBeHistory[];

  /* -----------------------------------------------------------
    CONSTRUCTOR
  ----------------------------------------------------------- */
  /**
   * Initializer constructor.
   *
   * @param props Properties to construct the agent
   */
  public constructor(private readonly props: IAutoBeProps<Model>) {
    this.agentica_ = new Agentica({
      model: props.model,
      vendor: props.vendor,
      config: props.config,
      controllers: [],
    });
    this.histories_ = props.histories?.slice() ?? [];
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
