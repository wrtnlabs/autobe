import { AutoBeState } from "../../context/AutoBeState";
import { transformPreliminaryHistories } from "./histories/transformPreliminaryHistories";
import { createPreliminaryCollection } from "./internal/createPreliminaryCollection";
import { createPreliminaryValidate } from "./internal/createPreliminaryValidator";
import { IAutoBePreliminaryApplication } from "./structures/IAutoBePreliminaryApplication";
import { IAutoBePreliminaryCollection } from "./structures/IAutoBePreliminaryCollection";

export class AutoBePreliminaryController<
  Key extends keyof IAutoBePreliminaryApplication,
> {
  public readonly keys: Key[];
  public readonly all: Pick<IAutoBePreliminaryCollection, Key>;
  public readonly local: Pick<IAutoBePreliminaryCollection, Key>;

  public constructor(props: AutoBePreliminaryController.IProps<Key>) {
    this.keys = props.keys;
    this.all = createPreliminaryCollection(props.state, props.all);
    this.local = createPreliminaryCollection(null, props.local);
  }

  public createValidate() {
    return createPreliminaryValidate(this.keys, this.all);
  }

  public getHistories() {
    return transformPreliminaryHistories(this);
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
