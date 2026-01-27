import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event emitted when a degenerate primitive type alias is analyzed and
 * potentially refined into a proper structured schema.
 *
 * This event is dispatched during the Interface phase when the Schema Refine
 * agent analyzes type aliases that may have been incorrectly simplified to
 * primitive types (`string`, `number`, `boolean`, `integer`) when they should
 * be complex structures like objects or records.
 *
 * The agent uses Chain-of-Thought reasoning (observation → reasoning → verdict)
 * to systematically evaluate each type before making a refinement decision.
 *
 * Common violations detected:
 *
 * - Record/Map patterns: JSDoc says "Key is X, Value is Y" but type is `number`
 * - Object patterns: Field is JSON in database but typed as `string`
 * - Distribution patterns: Name contains "Distribution" but type is primitive
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaCastingEvent
  extends
    AutoBeEventBase<"interfaceSchemaCasting">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Type name of the schema being analyzed for refinement.
   *
   * The name of the DTO type alias that may be incorrectly defined as a
   * primitive and potentially needs refinement into a proper structured
   * schema.
   */
  typeName: string;

  /**
   * The original schema definition before refinement.
   *
   * Contains the potentially degenerate schema (typically a primitive like
   * `string`, `number`, `boolean`, or `integer`) that is being evaluated. This
   * preserves the original state for comparison and audit purposes.
   */
  original: AutoBeOpenApi.IJsonSchemaDescriptive;

  /**
   * Observation of the current type and its documentation.
   *
   * Describes what was observed about the type: the current definition, JSDoc
   * content, database hints, and naming patterns. This is the first step in the
   * Chain-of-Thought reasoning process.
   */
  observation: string;

  /**
   * Reasoning about whether the type is degenerate.
   *
   * Analyzes the observations and explains the logical reasoning for the
   * decision. This is the second step in the Chain-of-Thought process.
   */
  reasoning: string;

  /**
   * Final verdict on whether to refine the type.
   *
   * States the conclusion clearly: whether this is a degenerate type needing
   * refinement or a valid primitive alias. This is the final step in the
   * Chain-of-Thought process.
   */
  verdict: string;

  /**
   * The refined object schema that replaces the degenerate primitive.
   *
   * Contains the proper object schema definition that accurately represents the
   * data structure described in the documentation. The refined schema is always
   * an object type (including `Record<K,V>` patterns via
   * `additionalProperties`).
   *
   * If `null`, the agent determined that the original type was intentional and
   * correct (e.g., `type IUserId = string` is a valid semantic alias).
   */
  refined: AutoBeOpenApi.IJsonSchemaDescriptive.IObject | null;

  /**
   * Current iteration number of the schema refinement process.
   *
   * Indicates which pass of refinement is being performed, helping track the
   * iterative improvement process.
   */
  step: number;
}
