import { AutoBeDescribeImageDraftGroup } from "../histories/contents/AutoBeDescribeImageDraftGroup";
import { IAutoBeTokenUsageJson } from "../json";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when the Describe agent groups related image drafts by cluster
 * key.
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
export interface AutoBeImageDescribeDraftGroupEvent
  extends AutoBeEventBase<"imageDescribeDraftGroup"> {
  /**
   * List of draft groups organized by cluster key.
   *
   * Each group contains drafts that share similar functionality or belong to
   * the same feature area, along with aggregated metadata for the group.
   */
  groups: AutoBeDescribeImageDraftGroup[];

  /**
   * Detailed token usage metrics for the operation.
   *
   * Contains comprehensive token consumption data including total usage, input
   * token breakdown with cache hit rates, and output token categorization by
   * generation type (reasoning, predictions). This component-level tracking
   * enables precise cost analysis and identification of operations that benefit
   * most from prompt caching or require optimization.
   *
   * Token usage directly translates to operational costs, making this metric
   * essential for understanding the financial implications of different
   * operation types and guiding resource allocation decisions.
   */
  tokenUsage: IAutoBeTokenUsageJson.IComponent;
}
