import { AutoBeInterfaceSchemaDecoupleCycle } from "../histories/contents/AutoBeInterfaceSchemaDecoupleCycle";
import { AutoBeInterfaceSchemaDecoupleRemoval } from "../histories/contents/AutoBeInterfaceSchemaDecoupleRemoval";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired when the Interface agent resolves one cross-type circular
 * reference cycle in OpenAPI schema definitions.
 *
 * Each detected cycle is processed independently: one LLM call per cycle, one
 * event dispatched per cycle. Multiple events may be emitted when multiple
 * cycles are detected in the schema graph.
 *
 * Cross-type circular references (A → B → A, or A → B → C → A) make code
 * generation impossible because they create infinite type recursion. The
 * Decouple agent programmatically detects these cycles using Tarjan's SCC
 * algorithm, then uses LLM judgment to decide which property reference(s) to
 * remove to break each cycle while preserving semantic integrity.
 *
 * Self-references (A → A) are NOT treated as circular references — they
 * represent legitimate tree structures (categories, org charts) and are handled
 * by the existing VariadicSingleton pattern in the Realize phase.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaDecoupleEvent
  extends
    AutoBeEventBase<"interfaceSchemaDecouple">,
    AutoBeAggregateEventBase,
    AutoBeProgressEventBase {
  /**
   * The circular reference cycle resolved in this event.
   *
   * Represents one strongly connected component of two or more types that
   * reference each other, forming an irresolvable loop.
   */
  cycle: AutoBeInterfaceSchemaDecoupleCycle;

  /**
   * The single property removal that broke this cycle.
   *
   * Specifies which property was deleted from which schema, along with the
   * LLM's reasoning for choosing that particular edge.
   */
  removal: AutoBeInterfaceSchemaDecoupleRemoval;

  /**
   * LLM analysis of this cycle and the removal decision.
   *
   * Documents the reasoning behind each removal decision, considering semantic
   * importance, reference direction, and DTO purpose.
   */
  analysis: string;

  /** Current iteration number of the requirements analysis. */
  step: number;
}
