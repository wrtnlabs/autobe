/**
 * Finalize the write loop by accepting your most recent `write` as-is.
 *
 * After submitting a `write`, review it yourself thoroughly against the review
 * checklist in your instructions. If you find issues worth fixing, submit
 * another `write` with corrections. When you are satisfied with the quality,
 * call `complete` to finalize.
 *
 * You have a maximum of 3 write attempts, but this is a safety cap — not a
 * target to fill.
 *
 * Only valid after at least one `write` submission — rejected otherwise.
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryComplete {
  /** Type discriminator for completion request. */
  type: "complete";
}
