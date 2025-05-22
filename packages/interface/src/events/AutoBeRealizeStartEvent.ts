import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeRealizeStartEvent
  extends AutoBeEventBase<"realizeStart"> {
  reason: string;
  step: number;
}
