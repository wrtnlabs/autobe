import { AutoBeRealizeCollectorFunction } from "./AutoBeRealizeCollectorFunction";
import { AutoBeRealizeOperationFunction } from "./AutoBeRealizeOperationFunction";
import { AutoBeRealizeTransformerFunction } from "./AutoBeRealizeTransformerFunction";

/**
 * Discriminated union of all Realize function types.
 *
 * The `type` discriminator distinguishes:
 *
 * - **AutoBeRealizeOperationFunction**: API operation implementations
 * - **AutoBeRealizeTransformerFunction**: DB → DTO transformers
 * - **AutoBeRealizeCollectorFunction**: DTO → DB collectors
 *
 * @author Samchon
 */
export type AutoBeRealizeFunction =
  | AutoBeRealizeOperationFunction
  | AutoBeRealizeTransformerFunction
  | AutoBeRealizeCollectorFunction;
