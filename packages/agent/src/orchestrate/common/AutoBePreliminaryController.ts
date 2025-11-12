import { IMicroAgenticaHistoryJson } from "@agentica/core";
import { AutoBeEventSource, AutoBePreliminaryKind } from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { v7 } from "uuid";

import { AutoBeConfigConstant } from "../../constants/AutoBeConfigConstant";
import { AutoBeContext } from "../../context/AutoBeContext";
import { AutoBeState } from "../../context/AutoBeState";
import { transformPreliminaryHistory } from "./histories/transformPreliminaryHistory";
import { complementPreliminaryCollection } from "./internal/complementPreliminaryCollection";
import { createPreliminaryCollection } from "./internal/createPreliminaryCollection";
import { createPreliminaryValidate } from "./internal/createPreliminaryValidate";
import { orchestratePreliminary } from "./orchestratePreliminary";
import { IAutoBeOrchestrateResult } from "./structures/IAutoBeOrchestrateResult";
import { IAutoBePreliminaryCollection } from "./structures/IAutoBePreliminaryCollection";

export class AutoBePreliminaryController<Kind extends AutoBePreliminaryKind> {
  private readonly source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
  private readonly source_id: string;
  private readonly kinds: Kind[];
  private readonly all: Pick<IAutoBePreliminaryCollection, Kind>;
  private readonly local: Pick<IAutoBePreliminaryCollection, Kind>;

  private empties: Set<Kind> | null;

  public constructor(props: AutoBePreliminaryController.IProps<Kind>) {
    this.source = props.source;
    this.source_id = v7();
    this.kinds = props.kinds;
    this.all = createPreliminaryCollection(props.state, props.all);
    this.local = createPreliminaryCollection(null, props.local);
    this.empties = null;

    complementPreliminaryCollection({
      kinds: props.kinds,
      all: this.all as IAutoBePreliminaryCollection,
      local: this.local as IAutoBePreliminaryCollection,
    });
  }

  public createValidate() {
    return createPreliminaryValidate({
      keys: this.kinds,
      all: this.all,
      local: this.local,
    });
  }

  public createHistories(): IMicroAgenticaHistoryJson[] {
    return transformPreliminaryHistory(this);
  }

  public getSource(): Exclude<AutoBeEventSource, "facade" | "preliminary"> {
    return this.source;
  }

  public getKinds(): Kind[] {
    return this.kinds;
  }

  public getAll(): Pick<IAutoBePreliminaryCollection, Kind> {
    return this.all;
  }

  public getLocal(): Pick<IAutoBePreliminaryCollection, Kind> {
    return this.local;
  }

  public getEmpties(): Kind[] | null {
    return this.empties ? Array.from(this.empties) : null;
  }

  public async orchestrate<Model extends ILlmSchema.Model, T>(
    ctx: AutoBeContext<Model>,
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

      await orchestratePreliminary(ctx, {
        source_id: this.source_id,
        source: this.source,
        preliminary: this,
        trial: i + 1,
        histories: result.histories,
        setEmpty: (kind: Kind, value: boolean) => {
          this.empties ??= new Set<Kind>();
          if (value === true) this.empties.add(kind);
          else this.empties.delete(kind);
        },
      });
    }
    throw new Error(
      "Preliminary process exceeded the maximum number of retries.",
    );
  }
}
export namespace AutoBePreliminaryController {
  export interface IProps<Kind extends AutoBePreliminaryKind> {
    source: Exclude<AutoBeEventSource, "facade" | "preliminary">;
    kinds: Kind[];
    state: AutoBeState;
    all?: Partial<Pick<IAutoBePreliminaryCollection, Kind>>;
    local?: Partial<Pick<IAutoBePreliminaryCollection, Kind>>;
  }
  export interface IProcessResult<T> {
    value: T | undefined;
    histories: IMicroAgenticaHistoryJson[];
  }
}
