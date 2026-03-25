import { tags } from "typia";

/** Request to retrieve individual analysis sections by numeric ID. */
export interface IAutoBePreliminaryGetAnalysisSections {
  /** Type discriminator. */
  type: "getAnalysisSections";

  /**
   * Section IDs to retrieve. DO NOT request same IDs already requested in
   * previous calls.
   */
  sectionIds: (number & tags.Type<"uint32">)[] &
    tags.MinItems<1> &
    tags.MaxItems<100>;
}
