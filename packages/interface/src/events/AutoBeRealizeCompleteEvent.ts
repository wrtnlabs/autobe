import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeRealizeCompleteEvent
  extends AutoBeEventBase<"realizeComplete"> {
  files: Record<string, string>;
  step: number;
}
