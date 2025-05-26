import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeAnalyzeWriteDocumentEvent
  extends AutoBeEventBase<"analyzeWriteDocument"> {
  files: {
    filename: string;
    content: string;
    contentLength: number;
  }[];
  step: number;
}
