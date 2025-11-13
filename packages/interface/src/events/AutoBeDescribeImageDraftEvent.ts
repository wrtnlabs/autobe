import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

export interface AutoBeDescribeImageDraftEvent
  extends AutoBeEventBase<"describeImageDraft">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {}
