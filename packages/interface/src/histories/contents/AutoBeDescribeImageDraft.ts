export interface AutoBeDescribeImageDraftMetadata {
  /**
   * A concise 1-2 sentence description of what these screens represent.
   *
   * Provides a quick overview of the functional area or feature set shown in
   * the analyzed images.
   */
  summary: string;

  /**
   * Array of 3-5 key features or functional areas identified from the images.
   *
   * These topics help categorize and search for related drafts. Examples:
   * ["user-management", "authentication", "profile-settings"]
   */
  topics: string[];

  /**
   * A unique key representing the functional area for grouping related screens.
   *
   * Used to cluster drafts that belong to the same feature or module. Examples:
   * "user-auth-flow", "product-catalog", "order-management"
   */
  clusterKey: string;
}
