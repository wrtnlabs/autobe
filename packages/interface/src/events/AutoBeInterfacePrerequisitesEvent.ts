import { AutoBeInterfacePrerequisite } from "../histories/contents/AutoBeInterfacePrerequisite";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

export interface AutoBeInterfacePrerequisitesEvent
  extends AutoBeEventBase<"interfacePrerequisites">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
  operations: AutoBeInterfacePrerequisite[];

  step: number;
}
