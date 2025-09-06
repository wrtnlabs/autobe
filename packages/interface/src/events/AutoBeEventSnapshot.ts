import { IAutoBeTokenUsageJson } from "../json";
import { AutoBeEventOfSerializable } from "./AutoBeEventOfSerializable";

/** @internal */
export interface AutoBeEventSnapshot<
  Event extends AutoBeEventOfSerializable = AutoBeEventOfSerializable,
> {
  event: Event;
  tokenUsage: IAutoBeTokenUsageJson;
}
