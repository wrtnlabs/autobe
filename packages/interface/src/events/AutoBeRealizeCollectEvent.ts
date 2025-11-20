import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

export interface AutoBeRealizeCollectEvent
  extends AutoBeEventBase<"realizeCollect">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  typeName: string;
}
