export interface IAutoBeDescribeImagesGroupsApplication {
  /**
   * Groups image drafts by their cluster keys and consolidates metadata.
   *
   * Analyzes the metadata from multiple image drafts and organizes them into
   * logical groups based on their cluster keys, enabling efficient processing
   * of related requirements together.
   */
  groupDrafts: (next: IAutoBeDescribeImagesGroupsApplication.IProps) => void;
}

export namespace IAutoBeDescribeImagesGroupsApplication {
  export interface IProps {
    /**
     * Array of groups organized by cluster key.
     *
     * Each group contains drafts that share similar functionality or belong to
     * the same feature area.
     */
    groups: IGroup[];
  }

  export interface IGroup {
    /**
     * The original cluster key from the drafts that should be grouped together.
     *
     * This must match an existing clusterKey from the input drafts' metadata.
     * Used to identify which drafts belong to this group.
     */
    originClusterKey: string;

    /**
     * The new cluster key to assign to this group.
     *
     * This will replace the originClusterKey for better representation
     * of the group's functionality.
     */
    newClusterKey: string;

    /**
     * Consolidated summary for the entire group.
     *
     * Provides an overview of the functional area covered by all drafts in this
     * group.
     */
    summary: string;

    /**
     * Aggregated list of all unique topics from the grouped drafts.
     *
     * Combines and deduplicates topics from all drafts in the group.
     */
    topics: string[];
  }
}
