import { IAutoBeTokenUsageJson } from "../json";
import { AutoBeEvent } from "./AutoBeEvent";

/** @internal */
export interface AutoBeEventSnapshot<Event extends AutoBeEvent = AutoBeEvent> {
  event: Event;
  tokenUsage: IAutoBeTokenUsageJson;
}
