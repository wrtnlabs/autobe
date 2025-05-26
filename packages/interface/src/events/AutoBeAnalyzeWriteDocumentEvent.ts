import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeAnalyzeWriteDocumentEvent
  extends AutoBeEventBase<"analyzeWriteDocument"> {
  files: Record<string, string>;
  step: number;
}
