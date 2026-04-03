/**
 * Shared completion request for cyclic write → validate → correct loops.
 *
 * The agent may call `write` up to 3 times (initial + revisions). After the 3rd
 * write, completion is forced. Only valid after at least one `write` submission
 * — rejected otherwise.
 *
 * The `remind` field forces the LLM to recall what it submitted and why it
 * considers the result correct before confirming — reducing premature or
 * hallucinated completions.
 *
 * @author Samchon
 */
export interface IAutoBePreliminaryComplete {
  /** Type discriminator for completion request. */
  type: "complete";

  /**
   * Brief reminder of what was submitted and why it is correct.
   *
   * Before confirming, recall:
   *
   * - What code/models you last submitted
   * - Why the validation passed
   * - Any key decisions or trade-offs made
   *
   * This self-check prevents premature finalization.
   */
  remind: string;

  /**
   * Explicit confirmation to finalize.
   *
   * Must be 'true' to proceed with finalization. Setting 'false' cancels the
   * completion and continues the loop.
   */
  confirm: boolean;
}
