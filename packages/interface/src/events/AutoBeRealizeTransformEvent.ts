import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

export interface AutoBeRealizeTransformEvent
  extends AutoBeEventBase<"realizeTransform">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  location: string;
  typeName: string;
  step: number;
}
