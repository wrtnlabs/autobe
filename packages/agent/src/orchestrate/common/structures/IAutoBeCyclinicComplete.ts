/**
 * Shared completion request for cyclinic write-compile-correct loops.
 *
 * Used across all phases that employ {@link AutoBeCyclinicController}. Only
 * available after a write submission has passed external validation (union
 * narrowing removes this type until then).
 *
 * The `remind` field forces the LLM to recall what it submitted and why it
 * considers the result correct before confirming — reducing premature or
 * hallucinated completions.
 *
 * @author Samchon
 */
export interface IAutoBeCyclinicComplete {
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
   * Must be `true` to proceed with finalization. Setting `false` cancels the
   * completion and continues the loop.
   */
  confirm: boolean;
}
