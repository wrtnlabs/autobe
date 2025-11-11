import {
  IAgenticaHistoryJson,
  IMicroAgenticaHistoryJson,
} from "@agentica/core";
import { AutoBeEventSource } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeState } from "../../context/AutoBeState";
import { transformPreliminaryHistories } from "./histories/transformPreliminaryHistories";
import { complementPreliminaryCollection } from "./internal/complementPreliminaryCollection";
import { createPreliminaryCollection } from "./internal/createPreliminaryCollection";
import { createPreliminaryValidate } from "./internal/createPreliminaryValidator";
import { orchestratePreliminary } from "./orchestratePreliminary";
import { IAutoBeOrchestrateResult } from "./structures/IAutoBeOrchestrateResult";
import { IAutoBePreliminaryApplication } from "./structures/IAutoBePreliminaryApplication";
import { IAutoBePreliminaryCollection } from "./structures/IAutoBePreliminaryCollection";

export class AutoBePreliminaryController<
  Key extends keyof IAutoBePreliminaryApplication,
> {
  private readonly keys: Key[];
  private readonly all: Pick<IAutoBePreliminaryCollection, Key>;
  private readonly local: Pick<IAutoBePreliminaryCollection, Key>;

  public constructor(props: AutoBePreliminaryController.IProps<Key>) {
    this.keys = props.keys;
    this.all = createPreliminaryCollection(props.state, props.all);
    this.local = createPreliminaryCollection(null, props.local);
    complementPreliminaryCollection({
      all: this.all as IAutoBePreliminaryCollection,
      local: this.local as IAutoBePreliminaryCollection,
    });
  }

  public createValidate() {
    return createPreliminaryValidate(this.keys, this.all);
  }

  public createHistories(): IAgenticaHistoryJson.IAssistantMessage[] {
    return transformPreliminaryHistories(this);
  }

  public getKeys(): Key[] {
    return this.keys;
  }

  public getAll(): Pick<IAutoBePreliminaryCollection, Key> {
    return this.all;
  }

  public getLocal(): Pick<IAutoBePreliminaryCollection, Key> {
    return this.local;
  }

  public async orchestrate<Model extends ILlmSchema.Model, T>(
    ctx: AutoBeContext<Model>,
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">,
    process: (
      out: (
        result: AutoBeContext.IResult<Model>,
      ) => (value: T | null) => IAutoBeOrchestrateResult<Model, T>,
    ) => Promise<IAutoBeOrchestrateResult<Model, T>>,
  ): Promise<T | never> {
    for (let i: number = 0; i < AutoBeConfigConstant.RAG_LIMIT; ++i) {
      const result: IAutoBeOrchestrateResult<Model, T> = await process(
        (x) => (value) => ({
          ...x,
          value,
        }),
      );
      if (result.value !== null) return result.value;
      else
        await orchestratePreliminary(ctx, {
          source: source,
          preliminary: this,
          histories: result.histories,
        });
    }
    throw new Error(
      "Preliminary process exceeded the maximum number of retries.",
    );
  }
}
export namespace AutoBePreliminaryController {
  export interface IProps<Key extends keyof IAutoBePreliminaryApplication> {
    keys: Key[];
    state: AutoBeState;
    all?: Partial<Pick<IAutoBePreliminaryCollection, Key>>;
    local?: Partial<Pick<IAutoBePreliminaryCollection, Key>>;
  }
  export interface IProcessResult<T> {
    value: T | undefined;
    histories: IMicroAgenticaHistoryJson[];
  }
}
