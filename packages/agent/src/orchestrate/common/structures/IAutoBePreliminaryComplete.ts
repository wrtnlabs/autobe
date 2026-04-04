/**
 * Finalize the write loop by accepting your most recent `write` as-is.
 *
 * After submitting a `write`, review it yourself and call `complete` to
 * finalize.
 *
 * Reserve additional `write` attempts exclusively for critical flaws —
 * structural errors, missing requirements, or broken logic that would cause
 * downstream failure. Minor imperfections are acceptable and expected. You have
 * a maximum of 3 write attempts, but this is a safety cap — not a target to
 * fill.
 *
 * Only valid after at least one `write` submission — rejected otherwise.
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryComplete {
  /** Type discriminator for completion request. */
  type: "complete";
}
