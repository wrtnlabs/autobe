import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeRealizeAuthorizationStartEvent
  extends AutoBeEventBase<"realizeAuthorizationStart"> {
  step: number;
}
