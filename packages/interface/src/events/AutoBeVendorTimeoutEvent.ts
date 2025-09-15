import OpenAI from "openai";

import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeEventSource } from "./AutoBeEventSource";

export interface AutoBeVendorTimeoutEvent
  extends AutoBeEventBase<"vendorTimeout"> {
  source: AutoBeEventSource;
  timeout: number;
  retry: number;
  options?: OpenAI.RequestOptions | undefined;
}
