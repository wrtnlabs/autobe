import { AutoBeInterfaceSchemaRefactor } from "../histories/contents/AutoBeInterfaceSchemaRefactor";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeInterfaceSchemaRenameEvent
  extends AutoBeEventBase<"interfaceSchemaRename"> {
  refactors: AutoBeInterfaceSchemaRefactor[];
}
