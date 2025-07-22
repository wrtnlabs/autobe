import {
  AutoBeEvent,
  AutoBeHistory,
  IAutoBeCompiler,
  IAutoBeGetFilesOptions,
} from "@autobe/interface";

import { AutoBeState } from "./context/AutoBeState";
import { AutoBeTokenUsage } from "./context/AutoBeTokenUsage";
import { getAutoBeGenerated } from "./factory/getAutoBeGenerated";
import { emplaceMap } from "./utils/emplaceMap";

export abstract class AutoBeAgentBase {
  /** @internal */
  private readonly listeners_: Map<
    string,
    Set<(event: AutoBeEvent) => Promise<void> | void>
  >;

  public constructor(private readonly asset: AutoBeAgentBase.IAsset) {
    this.listeners_ = new Map();
  }

  public async getFiles(
    options?: Partial<IAutoBeGetFilesOptions>,
  ): Promise<Record<string, string>> {
    return getAutoBeGenerated(
      await this.asset.compiler(),
      this.asset.state(),
      this.getHistories(),
      this.getTokenUsage(),
      options,
    );
  }
  public abstract getHistories(): AutoBeHistory[];
  public abstract getTokenUsage(): AutoBeTokenUsage;

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

  /** @internal */
  protected async dispatch(event: AutoBeEvent): Promise<void> {
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
export namespace AutoBeAgentBase {
  export interface IAsset {
    compiler: () => Promise<IAutoBeCompiler>;
    state: () => AutoBeState;
  }
}
