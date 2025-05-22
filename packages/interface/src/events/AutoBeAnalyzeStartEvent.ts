import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeAnalyzeStartEvent
  extends AutoBeEventBase<"analyzeStart"> {
  reason: string;
  step: number;
}
