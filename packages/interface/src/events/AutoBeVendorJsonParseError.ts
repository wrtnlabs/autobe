import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeEventSource } from "./AutoBeEventSource";

export interface AutoBeVendorJsonParseError
  extends AutoBeEventBase<"vendorJsonParseError"> {
  source: AutoBeEventSource;
  arguments: string;
  errorMessage: string;
}
