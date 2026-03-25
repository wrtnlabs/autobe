import { tags } from "typia";

/**
 * Request to retrieve interface schemas from the previous iteration.
 *
 * Loads OpenAPI schema definitions (DTOs) from the last successfully generated
 * version, used as reference context during regeneration or modification
 * cycles.
 */
export interface IAutoBePreliminaryGetPreviousInterfaceSchemas {
  /** Type discriminator. */
  type: "getPreviousInterfaceSchemas";

  /**
   * Schema type names to retrieve from previous iteration. DO NOT request same
   * names already requested in previous calls.
   */
  typeNames: string[] & tags.MinItems<1>;
}
