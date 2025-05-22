import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeTestStartEvent extends AutoBeEventBase<"testStart"> {
  reason: string;
  step: number;
}
