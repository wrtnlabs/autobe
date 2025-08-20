import { IValidation } from "typia";

import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeEventSource } from "./AutoBeEventSource";

export interface AutoBeVendorValidateEvent
  extends AutoBeEventBase<"vendorValidate"> {
  source: AutoBeEventSource;
  result: IValidation.IFailure;
}
