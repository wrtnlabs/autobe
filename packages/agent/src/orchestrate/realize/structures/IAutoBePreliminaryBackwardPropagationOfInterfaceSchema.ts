import { tags } from "typia";

/**
 * Request backward propagation to redesign improperly designed DTO schemas.
 *
 * When the realize agent discovers that DTO schemas are inadequately designed
 * for proper API implementation, it can trigger this request to have the
 * interface schema refine process redesign the affected schemas before
 * continuing with code generation.
 */
export interface IAutoBePreliminaryBackwardPropagationOfInterfaceSchema {
  /** Type discriminator for backward propagation request. */
  type: "backwardPropagateInterfaceSchema";

  /**
   * DTO type names that need to be redesigned.
   *
   * These should be schema names from `components.schemas` that are problematic
   * for implementation.
   */
  typeNames: string[] & tags.MinItems<1>;

  /**
   * Detailed reason why these schemas need redesign.
   *
   * Explain what implementation issues the current schema design causes, so the
   * interface schema refine agent can understand the problem and produce a
   * better design.
   */
  reason: string;
}
