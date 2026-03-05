import { AutoBePreliminaryKind } from "../../typings/AutoBePreliminaryKind";
import { AutoBePreliminaryAcquisition } from "../contents/AutoBePreliminaryAcquisition";

/**
 * Base interface for events that track which preliminary data was acquired by
 * an agent during its RAG (Retrieval-Augmented Generation) process.
 *
 * When an agent executes, it incrementally loads preliminary data (analysis
 * sections, database schemas, interface operations, etc.) through the
 * {@link AutoBePreliminaryController}. This base interface captures a
 * lightweight summary of what data was actually loaded into the agent's context
 * at the time the event was emitted.
 *
 * The `Kind` type parameter constrains which acquisition fields are included,
 * ensuring each event only carries the subset of preliminary data relevant to
 * its agent. For example, a database group event only tracks acquisition of
 * `"analysisSections" | "previousAnalysisSections" |
 * "previousDatabaseSchemas"`, while an interface prerequisite event tracks
 * nearly all kinds.
 *
 * The acquisition data contains only identifiers (file names, schema names,
 * endpoint path+method pairs, DTO type names) rather than full payloads,
 * keeping event sizes minimal while providing full traceability for debugging,
 * auditing, and replay purposes.
 *
 * @author Samchon
 * @template Kind - Union of {@link AutoBePreliminaryKind} keys that this event's
 *   agent can acquire during its RAG process.
 */
export interface AutoBeAcquisitionEventBase<
  Kind extends AutoBePreliminaryKind,
> {
  /**
   * Summary of preliminary data acquired by the agent during RAG.
   *
   * Contains lightweight identifiers for each kind of preliminary data that was
   * loaded into the agent's local context before producing its output. Only the
   * kinds specified by the `Kind` type parameter are present.
   */
  acquisition: Pick<AutoBePreliminaryAcquisition, Kind>;
}
