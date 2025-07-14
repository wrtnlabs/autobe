import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeRealizeTestStartEvent
  extends AutoBeEventBase<"realizeTestStart"> {
  reset: boolean;
  simulateneous: number;
  step: number;
}
