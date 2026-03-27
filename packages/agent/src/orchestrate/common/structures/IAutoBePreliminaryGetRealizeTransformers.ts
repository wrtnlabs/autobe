import { tags } from "typia";

/** Request to retrieve Realize Transformer function definitions for context. */
export interface IAutoBePreliminaryGetRealizeTransformers {
  /** Type discriminator. */
  type: "getRealizeTransformers";

  /**
   * Transformer DTO type names to retrieve. DO NOT request same names already
   * requested in previous calls.
   */
  dtoTypeNames: string[] & tags.MinItems<1>;
}
