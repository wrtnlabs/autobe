import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeInterfaceCompleteEvent
  extends AutoBeEventBase<"interfaceComplete"> {
  document: AutoBeOpenApi.IDocument;
  files: Record<string, string>;
  reason: string;
  step: number;
}
