import { IValidation } from "typia";

import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeEventSource } from "./AutoBeEventSource";

export interface AutoBeJsonValidateErrorEvent
  extends AutoBeEventBase<"jsonValidateError"> {
  source: AutoBeEventSource;
  result: IValidation.IFailure;
  life: number;
}
