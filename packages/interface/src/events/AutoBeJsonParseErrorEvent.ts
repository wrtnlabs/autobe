import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeEventSource } from "./AutoBeEventSource";

export interface AutoBeJsonParseErrorEvent
  extends AutoBeEventBase<"jsonParseError"> {
  source: AutoBeEventSource;
  arguments: string;
  errorMessage: string;
  life: number;
}
