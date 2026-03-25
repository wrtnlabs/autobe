import { tags } from "typia";

/**
 * Request to retrieve analysis sections from the previous iteration by numeric
 * ID.
 */
export interface IAutoBePreliminaryGetPreviousAnalysisSections {
  /** Type discriminator. */
  type: "getPreviousAnalysisSections";

  /**
   * Section IDs to retrieve from previous iteration. DO NOT request same IDs
   * already requested in previous calls.
   */
  sectionIds: (number & tags.Type<"uint32">)[] & tags.MinItems<1>;
}
