/**
 * Shared completion request for cyclic write → validate → correct loops.
 *
 * The agent may call `write` up to 3 times (initial + revisions). After the 3rd
 * write, completion is forced. Only valid after at least one `write` submission
 * — rejected otherwise.
 *
 * When `type` is `"complete"`, the loop terminates immediately. No additional
 * fields are required — the single discriminator is sufficient to signal that
 * the agent considers its last write final.
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryComplete {
  /** Type discriminator for completion request. */
  type: "complete";
}
