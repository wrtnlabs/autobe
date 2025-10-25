import { AutoBeInterfaceSchemaRefactor } from "../histories/contents/AutoBeInterfaceSchemaRefactor";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

export interface AutoBeInterfaceSchemaRenameEvent
  extends AutoBeEventBase<"interfaceSchemaRename">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
  refactors: AutoBeInterfaceSchemaRefactor[];
}
