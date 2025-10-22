import { AutoBeInterfacePrerequisite } from "../histories/contents/AutoBeInterfacePrerequisite";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

export interface AutoBeInterfacePrerequisiteEvent
  extends AutoBeEventBase<"interfacePrerequisite">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
  operations: AutoBeInterfacePrerequisite[];

  step: number;
}
