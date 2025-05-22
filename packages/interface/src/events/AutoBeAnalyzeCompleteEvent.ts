import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeAnalyzeCompleteEvent
  extends AutoBeEventBase<"analyzeComplete"> {
  files: Record<string, string>;
  step: number;
}
