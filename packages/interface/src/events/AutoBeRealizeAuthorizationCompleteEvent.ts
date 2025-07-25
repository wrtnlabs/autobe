import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeRealizeAuthorizationCompleteEvent
  extends AutoBeEventBase<"realizeAuthorizationComplete"> {
  step: number;
}
