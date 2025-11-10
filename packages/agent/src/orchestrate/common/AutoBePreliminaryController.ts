import { IAgenticaHistoryJson } from "@agentica/core";

import { AutoBeState } from "../../context/AutoBeState";
import { transformPreliminaryHistories } from "./histories/transformPreliminaryHistories";
import { createPreliminaryCollection } from "./internal/createPreliminaryCollection";
import { createPreliminaryValidate } from "./internal/createPreliminaryValidator";
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
  }

  public createValidate() {
    return createPreliminaryValidate(this.keys, this.all);
  }

  public getHistories(): IAgenticaHistoryJson.IAssistantMessage[] {
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
}
export namespace AutoBePreliminaryController {
  export interface IProps<Key extends keyof IAutoBePreliminaryApplication> {
    keys: Key[];
    state: AutoBeState;
    all?: Partial<Pick<IAutoBePreliminaryCollection, Key>>;
    local?: Partial<Pick<IAutoBePreliminaryCollection, Key>>;
  }
}
