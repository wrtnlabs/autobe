/**
 * Finalize the write loop by accepting your most recent `write` as-is.
 *
 * After submitting a `write`, review it yourself. If you are satisfied, call
 * `complete` to finalize. If you want to improve it, submit another `write`
 * instead. You have a maximum of 3 write attempts, but this is a safety cap —
 * not a target to fill.
 *
 * Only valid after at least one `write` submission — rejected otherwise.
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryComplete {
  /** Type discriminator for completion request. */
  type: "complete";
}
