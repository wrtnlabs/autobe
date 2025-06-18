import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeAnalyzeWriteEvent
  extends AutoBeEventBase<"analyzeWrite"> {
  files: Record<string, string>;
  step: number;
}
