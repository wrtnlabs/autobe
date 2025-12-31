import { tags } from "typia";

/**
 * Request to retrieve Realize Collector function definitions for context.
 *
 * This type is used in the preliminary phase to request specific collector
 * functions generated during the REALIZE_COLLECTOR_WRITE phase. Collectors
 * transform API request DTOs into database CreateInput structures.
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryGetRealizeCollectors {
  /**
   * Type discriminator for the request.
   *
   * Determines which action to perform: preliminary data retrieval or actual
   * task execution. Value "getRealizeCollectors" indicates this is a
   * preliminary data request for collector functions.
   */
  type: "getRealizeCollectors";

  /**
   * List of collector DTO type names to retrieve.
   *
   * DTO type names for Create DTOs that have collector functions (e.g.,
   * "IShoppingSale.ICreate", "IBbsArticle.ICreate").
   *
   * CRITICAL: DO NOT request the same type names that you have already
   * requested in previous calls.
   */
  dtoTypeNames: string[] & tags.MinItems<1>;
}
