import { tags } from "typia";

/** Request to retrieve Realize Collector function definitions for context. */
export interface IAutoBePreliminaryGetRealizeCollectors {
  /** Type discriminator. */
  type: "getRealizeCollectors";

  /**
   * Collector DTO type names to retrieve. DO NOT request same names already
   * requested in previous calls.
   */
  dtoTypeNames: string[] & tags.MinItems<1>;
}
