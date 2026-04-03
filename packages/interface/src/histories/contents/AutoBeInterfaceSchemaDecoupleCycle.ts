import { AutoBeInterfaceSchemaDecoupleEdge } from "./AutoBeInterfaceSchemaDecoupleEdge";

/**
 * A group of mutually-reachable types forming a circular reference.
 *
 * Identified as a strongly connected component (SCC) in the schema reference
 * graph with two or more nodes. The LLM Decouple agent receives these cycles
 * and decides which edge(s) to cut.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaDecoupleCycle {
  /** Type names involved in this cycle. */
  types: string[];

  /** All reference edges between types in this cycle. */
  edges: AutoBeInterfaceSchemaDecoupleEdge[];
}
