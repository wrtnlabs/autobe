import { AutoBeEvent } from "@autobe/interface";

export interface IAutoBeEventGroup<Event extends AutoBeEvent = AutoBeEvent> {
  type: Event["type"];
  events: Array<Event>;
}
