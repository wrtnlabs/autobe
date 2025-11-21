import { AutoBeRealizeCollectorFunction } from "./AutoBeRealizeCollectorFunction";
import { AutoBeRealizeOperationFunction } from "./AutoBeRealizeOperationFunction";
import { AutoBeRealizeTransformerFunction } from "./AutoBeRealizeTransformerFunction";

/**
 * Discriminated union of all Realize function types.
 *
 * Encompasses all types of generated code during the Realize phase:
 *
 * - **AutoBeRealizeOperationFunction**: API operation implementations
 * - **AutoBeRealizeTransformerFunction**: DB → DTO transformers
 * - **AutoBeRealizeCollectorFunction**: DTO → DB collectors
 *
 * The `kind` discriminator enables type-safe pattern matching and ensures
 * proper handling of each function type's unique metadata.
 *
 * @author Samchon
 */
export type AutoBeRealizeFunction =
  | AutoBeRealizeOperationFunction
  | AutoBeRealizeTransformerFunction
  | AutoBeRealizeCollectorFunction;
