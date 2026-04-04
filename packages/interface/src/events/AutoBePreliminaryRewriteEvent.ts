import { AutoBeEventSource } from "./AutoBeEventSource";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when the LLM agent submits a subsequent `write` call during the
 * preliminary RAG write loop, replacing its previous output.
 *
 * The preliminary system operates as a write-review-rewrite cycle: after the
 * LLM incrementally loads context via RAG requests and submits its first
 * `write`, the system allows it to self-review the output. If the LLM is
 * satisfied, it calls `complete` to finalize
 * ({@link IAutoBePreliminaryComplete}). If it wants to improve, it submits
 * another `write` — and that subsequent write triggers this event.
 *
 * This event captures the full before-and-after picture of a rewrite: the
 * agent's reasoning for why the previous output was insufficient (`thinking`),
 * the raw arguments of the previous write (`oldbie`), and the raw arguments of
 * the new replacement write (`newbie`). The number of rewrites is capped by
 * `AutoBeConfigConstant.PRELIMINARY_WRITE_LIMIT`.
 *
 * Unlike {@link AutoBePreliminaryAcquireEvent} which tracks incremental context
 * loading (RAG data requests), this event specifically tracks the moment the
 * agent decides its prior output needs improvement and submits a replacement.
 *
 * @author Samchon
 */
export interface AutoBePreliminaryRewriteEvent extends AutoBeEventBase<"preliminaryRewrite"> {
  /**
   * Source orchestrator whose write loop produced this rewrite.
   *
   * Identifies which pipeline operation (e.g., database schema generation,
   * interface operation design, test scenario creation) the LLM was working on
   * when it decided to rewrite its previous output. Cannot be "facade" or
   * "preliminaryAcquire" as those are not content-producing orchestrators.
   */
  source: Exclude<AutoBeEventSource, "facade" | "preliminaryAcquire">;

  /**
   * The LLM's chain-of-thought reasoning for why the previous write was
   * insufficient and what the new write improves.
   *
   * Extracted from the `thinking` field of the LLM's function calling
   * arguments. Documents the agent's self-review process: what it found lacking
   * in the previous output and what design decisions changed in the
   * replacement. Useful for debugging output quality and understanding the
   * agent's iterative refinement process.
   */
  thinking: string;

  /**
   * Raw function calling arguments from the previous `write` submission.
   *
   * Contains the full arguments object the LLM passed in its prior `write` call
   * (e.g., `{ type: "write", plan: "...", definition: {...} }` for database
   * schema generation). The structure varies by orchestrator type. Comparing
   * `oldbie` and `newbie` reveals exactly what the agent changed during its
   * self-review rewrite cycle.
   */
  oldbie: Record<string, unknown>;

  /**
   * Raw function calling arguments from the new replacement `write` submission.
   *
   * Contains the full arguments object the LLM passed in its latest `write`
   * call, which replaces the previous output stored in `oldbie`. This becomes
   * the candidate output that will either be finalized via `complete` or
   * replaced again by yet another rewrite if the write limit has not been
   * reached.
   */
  newbie: Record<string, unknown>;
}
