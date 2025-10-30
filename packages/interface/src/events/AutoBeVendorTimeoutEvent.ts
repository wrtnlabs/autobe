import OpenAI from "openai";

import { AutoBeEventSource } from "./AutoBeEventSource";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

export interface AutoBeVendorTimeoutEvent
  extends AutoBeEventBase<"vendorTimeout"> {
  source: AutoBeEventSource;
  timeout: number;
  retry: number;
  options?: OpenAI.RequestOptions | undefined;
}
