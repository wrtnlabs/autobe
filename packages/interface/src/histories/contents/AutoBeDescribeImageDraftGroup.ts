export interface AutoBeDescribeImageDraftGroup {
  /**
   * The cluster key that groups these related drafts together.
   *
   * All drafts in this group share the same or similar clusterKey, representing
   * a cohesive functional area or feature set.
   */
  clusterKey: string;

  /**
   * A consolidated summary describing the entire group of related drafts.
   *
   * Provides an overview of the functional area covered by all drafts in this
   * group.
   */
  summary: string;

  /**
   * Aggregated list of all unique topics from the grouped drafts.
   *
   * Combines and deduplicates topics from all drafts in the group to provide a
   * comprehensive view of features covered.
   */
  topics: string[];

  /**
   * The collection of related drafts grouped by their cluster key.
   *
   * Each draft represents analysis from a different batch of images but belongs
   * to the same functional area or feature set.
   */
  drafts: string[];
}
