import { AutoBeInterfaceSchemaDecoupleCycle } from "../histories/contents/AutoBeInterfaceSchemaDecoupleCycle";
import { AutoBeInterfaceSchemaDecoupleRemoval } from "../histories/contents/AutoBeInterfaceSchemaDecoupleRemoval";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when the Interface agent detects and resolves cross-type
 * circular references in OpenAPI schema definitions.
 *
 * Cross-type circular references (A → B → A, or A → B → C → A) make
 * code generation impossible because they create infinite type recursion.
 * The Decouple agent programmatically detects these cycles using graph
 * analysis, then uses LLM judgment to decide which property reference(s)
 * to remove to break each cycle while preserving semantic integrity.
 *
 * Self-references (A → A) are NOT treated as circular references —
 * they represent legitimate tree structures (categories, org charts)
 * and are handled by the existing VariadicSingleton pattern in the
 * Realize phase.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaDecoupleEvent
  extends AutoBeEventBase<"interfaceSchemaDecouple">,
    AutoBeAggregateEventBase {
  /**
   * Cross-type circular reference cycles detected in the schema graph.
   *
   * Each cycle represents a strongly connected component of two or more
   * types that reference each other, forming an irresolvable loop.
   */
  cycles: AutoBeInterfaceSchemaDecoupleCycle[];

  /**
   * Properties removed to break the detected cycles.
   *
   * Each removal specifies which property was deleted from which schema,
   * along with the LLM's reasoning for choosing that particular edge.
   */
  removals: AutoBeInterfaceSchemaDecoupleRemoval[];

  /**
   * LLM analysis of the circular references and resolution decisions.
   *
   * Documents the reasoning behind each removal decision, considering
   * semantic importance, reference direction, and DTO purpose.
   */
  analysis: string;

  /**
   * Current iteration number of the requirements analysis.
   */
  step: number;
}
