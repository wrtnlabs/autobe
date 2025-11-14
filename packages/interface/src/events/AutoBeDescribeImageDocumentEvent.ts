import { AutoBeDescribeImageDocument } from "../histories/contents/AutoBeDescribeImageDocument";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

export interface AutoBeDescribeImageDocumentEvent
  extends AutoBeEventBase<"describeImageDocument">,
    AutoBeAggregateEventBase {
  /**
   * The complete B2B SaaS requirements document generated from images.
   */
  contents: AutoBeDescribeImageDocument;
}