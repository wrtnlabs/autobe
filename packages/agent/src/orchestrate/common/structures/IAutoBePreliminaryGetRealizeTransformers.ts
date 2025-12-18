import { tags } from "typia";

/**
 * Request to retrieve Realize Transformer function definitions for context.
 *
 * This type is used in the preliminary phase to request specific transformer
 * functions generated during the REALIZE_TRANSFORMER_WRITE phase. Transformers
 * convert Prisma query results into API response DTOs.
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryGetRealizeTransformers {
  /**
   * Type discriminator for the request.
   *
   * Determines which action to perform: preliminary data retrieval or actual
   * task execution. Value "getRealizeTransformers" indicates this is a
   * preliminary data request for transformer functions.
   */
  type: "getRealizeTransformers";

  /**
   * List of transformer DTO type names to retrieve.
   *
   * DTO type names for response DTOs that have transformer functions (e.g.,
   * "IShoppingSale", "IBbsArticle", "IShoppingSale.ISummary").
   *
   * CRITICAL: DO NOT request the same type names that you have already
   * requested in previous calls.
   */
  dtoTypeNames: string[] & tags.MinItems<1>;
}
