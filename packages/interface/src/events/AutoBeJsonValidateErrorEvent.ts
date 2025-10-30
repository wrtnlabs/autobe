import { IValidation } from "typia";

import { AutoBeEventSource } from "./AutoBeEventSource";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

export interface AutoBeJsonValidateErrorEvent
  extends AutoBeEventBase<"jsonValidateError"> {
  source: AutoBeEventSource;
  result: IValidation.IFailure;
  life: number;
}
