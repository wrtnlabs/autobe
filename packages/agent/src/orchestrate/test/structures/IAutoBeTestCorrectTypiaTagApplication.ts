/**
 * Function calling interface for fixing Typia tag type incompatibility errors.
 * 
 * This interface is used by the TestCorrectTypiaTag agent to fix TypeScript
 * compilation errors that specifically contain the error message:
 * "Types of property '\"typia.tag\"' are incompatible".
 * 
 * The agent handles tag mismatches between different Typia-tagged types,
 * such as:
 * - Format tag mismatches (e.g., Format<"uuid"> vs Pattern<...>)
 * - Type constraint incompatibilities (e.g., Type<"int32"> vs Type<"int32"> & Minimum<0>)
 * - Nullable type conversions with tags
 * - Date to tagged string conversions (e.g., Date to string & Format<"date-time">)
 * 
 * @author Samchon
 */
export interface IAutoBeTestCorrectTypiaTagApplication {
  /**
   * Rewrite function to fix Typia tag type incompatibility errors.
   *
   * This function is called when the agent detects the specific compilation
   * error pattern: "Types of property '\"typia.tag\"' are incompatible".
   * 
   * The agent applies various fix strategies:
   * - Uses `satisfies ... as ...` pattern to strip incompatible tags
   * - Converts Date objects to ISO strings for date-time format tags
   * - Handles nullable type conversions properly
   * - Uses `typia.assert<T>()` as a last resort for persistent errors
   *
   * @param props - The analysis and correction properties
   * @param props.think - Analysis of the tag incompatibility pattern found
   * @param props.draft - Initial corrected code with tag conversions applied
   * @param props.revise - Review of conversions and final corrected code
   */
  rewrite(props: IAutoBeTestCorrectTypiaTagApplication.IProps): void;

  /**
   * Reject function when error is not related to Typia tag incompatibility.
   * 
   * This function is called when the compilation error does NOT contain
   * "Types of property '\"typia.tag\"' are incompatible", indicating the
   * error should be handled by a different agent.
   */
  reject(): void;
}
export namespace IAutoBeTestCorrectTypiaTagApplication {
  /**
   * Properties for the rewrite function containing the tag incompatibility
   * analysis and correction workflow.
   */
  export interface IProps {
    /**
     * Initial analysis of the Typia tag incompatibility.
     *
     * Contains the agent's analysis of the specific tag mismatch pattern:
     * - What tags are incompatible (e.g., Format<"uuid"> vs Pattern<...>)
     * - Whether nullable types are involved
     * - If Date to string conversions are needed
     * - The chosen fix strategy (satisfies pattern, toISOString, or typia.assert)
     */
    think: string;

    /**
     * Draft correction with initial tag conversions.
     *
     * The code after applying the first round of fixes:
     * - Basic satisfies patterns for tag stripping
     * - Date.toISOString() conversions where needed
     * - Initial nullable type handling
     */
    draft: string;

    /**
     * Review and finalization of tag conversions.
     *
     * Contains the review of applied conversions and the final code with all
     * tag incompatibilities resolved while preserving validation intent.
     */
    revise: IReviseProps;
  }

  /** Properties for the revision phase of tag conversion corrections. */
  export interface IReviseProps {
    /**
     * Review of the tag conversion patterns applied.
     *
     * Explains which conversion strategies were used:
     * - Which satisfies patterns were applied
     * - Where typia.assert was used as last resort
     * - How Date conversions were handled
     * - Confirmation that all tag incompatibilities are resolved
     */
    review: string;

    /**
     * Final corrected code with all tag incompatibilities resolved.
     *
     * The complete code ready for TypeScript compilation, with all Typia
     * tag type mismatches properly converted using appropriate patterns
     * while maintaining the original validation logic.
     */
    final: string;
  }
}
