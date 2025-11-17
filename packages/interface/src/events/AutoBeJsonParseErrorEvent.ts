import { AutoBeEventSource } from "./AutoBeEventSource";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

export interface AutoBeJsonParseErrorEvent
  extends AutoBeEventBase<"jsonParseError"> {
  source: AutoBeEventSource;
  function: string;
  arguments: string;
  errorMessage: string;
  life: number;
}
