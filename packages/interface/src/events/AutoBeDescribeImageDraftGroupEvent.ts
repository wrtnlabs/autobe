import { AutoBeDescribeImageDraftGroup } from "../histories/contents/AutoBeDescribeImageDraftGroup";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when the Describe agent groups related image drafts by cluster key.
 *
 * This event occurs after multiple image drafts have been generated and the
 * system groups them based on their cluster keys to organize related functional
 * areas together. Each group represents a cohesive set of requirements for a
 * specific feature or module.
 *
 * The grouping enables efficient processing of large sets of image-based
 * requirements by consolidating related drafts that can be processed together
 * to generate comprehensive backend specifications.
 */
export interface AutoBeDescribeImageDraftGroupEvent
  extends AutoBeEventBase<"describeImageDraftGroup">,
    AutoBeAggregateEventBase {
  /**
   * List of draft groups organized by cluster key.
   *
   * Each group contains drafts that share similar functionality or belong
   * to the same feature area, along with aggregated metadata for the group.
   */
  groups: AutoBeDescribeImageDraftGroup[];
}