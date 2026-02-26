import { tags } from "typia";

/**
 * Request to retrieve individual analysis sections from previous iteration by
 * numeric ID.
 *
 * Same as {@link IAutoBePreliminaryGetAnalysisSections} but for sections from
 * the previous generation cycle, enabling comparison and consistency checks.
 *
 * @author Juntak
 */
export interface IAutoBePreliminaryGetPreviousAnalysisSections {
  /**
   * Type discriminator for the request.
   *
   * Value "getPreviousAnalysisSections" indicates this is a preliminary data
   * request for analysis sections from the previous iteration.
   */
  type: "getPreviousAnalysisSections";

  /**
   * List of section IDs to retrieve from the previous iteration.
   *
   * CRITICAL: DO NOT request the same section IDs that you have already
   * requested in previous calls.
   */
  sectionIds: (number & tags.Type<"uint32">)[] & tags.MinItems<1>;
}
