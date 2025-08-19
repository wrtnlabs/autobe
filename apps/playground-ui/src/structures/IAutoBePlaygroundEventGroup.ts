import { AutoBeEvent } from "@autobe/interface";

export interface IAutoBePlaygroundEventGroup<
  Event extends AutoBeEvent = AutoBeEvent,
> {
  type: Event["type"];
  events: Array<Event>;
}
