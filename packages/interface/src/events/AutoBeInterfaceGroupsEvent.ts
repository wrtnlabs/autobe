import { AutoBeInterfaceGroup } from "../histories/contents/AutoBeInterfaceGroup";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeInterfaceGroupsEvent
  extends AutoBeEventBase<"interfaceGroups"> {
  groups: AutoBeInterfaceGroup[];
  step: number;
}
