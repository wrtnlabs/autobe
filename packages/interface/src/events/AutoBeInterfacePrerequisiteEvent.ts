import { AutoBeInterfacePrerequisite } from "../histories/contents/AutoBeInterfacePrerequisite";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

export interface AutoBeInterfacePrerequisiteEvent
  extends AutoBeEventBase<"interfacePrerequisite">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  operations: AutoBeInterfacePrerequisite[];

  step: number;
}
