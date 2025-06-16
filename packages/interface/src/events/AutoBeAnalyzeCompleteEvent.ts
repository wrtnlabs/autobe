import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeAnalyzeCompleteEvent
  extends AutoBeEventBase<"analyzeComplete"> {
  prefix: string;
  files: Record<string, string>;
  step: number;
}
