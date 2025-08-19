import { AutoBeEvent } from "@autobe/interface";

export interface IOnEventAutoBe {
  type: "on_event_auto_be";
  sessionId: string;
  data: AutoBeEvent;
}
