import { AutoBeOpenApi } from "@autobe/interface";
import { tags } from "typia";

/**
 * Request to retrieve interface operations from the previous iteration.
 *
 * Loads API operation definitions from the last successfully generated version,
 * used as reference context during regeneration or modification cycles.
 */
export interface IAutoBePreliminaryGetPreviousInterfaceOperations {
  /** Type discriminator. */
  type: "getPreviousInterfaceOperations";

  /**
   * Endpoints to retrieve from previous iteration. DO NOT request same
   * endpoints already requested in previous calls.
   */
  endpoints: AutoBeOpenApi.IEndpoint[] & tags.MinItems<1>;
}
