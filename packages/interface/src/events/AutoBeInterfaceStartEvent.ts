import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeInterfaceStartEvent
  extends AutoBeEventBase<"interfaceStart"> {
  reason: string;
  step: number;
}
