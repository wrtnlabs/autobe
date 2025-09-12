/**
 * Function calling interface for fixing TypeScript type casting and assignment errors.
 *
 * This interface is used by the CommonCorrectCasting agent to fix TypeScript
 * compilation errors related to type casting and type assignment incompatibilities
 * in any TypeScript code, not limited to e2e tests.
 *
 * The agent handles various type casting issues including:
 *
 * - **Typia tag type incompatibilities**: Format tag mismatches (e.g., Format<"uuid"> 
 *   vs Pattern<...>), type constraint incompatibilities (e.g., Type<"int32"> vs 
 *   Type<"int32"> & Minimum<0>), nullable type conversions with tags
 * - **Date to string conversions**: Date to string, Date to string & Format<"date-time">, 
 *   nullable Date handling
 * - **Nullable and undefined type assignments**: Exhaustive type narrowing for 
 *   T | null | undefined patterns
 * - **String to literal type assignments**: Converting general string to literal 
 *   union types (e.g., "pending" | "approved" | "rejected")
 * - **Optional chaining with union types**: Handling boolean | undefined results 
 *   from array methods like includes()
 * - **Type narrowing "no overlap" errors**: Removing redundant comparisons after 
 *   TypeScript's control flow analysis
 *
 * @author Samchon
 */
export interface IAutoBeCommonCorrectCastingApplication {
  /**
   * Rewrite function to fix type casting and assignment errors.
   *
   * This function is called when the agent detects any type casting or assignment
   * related compilation error patterns.
   *
   * The agent applies various fix strategies based on the error type:
   *
   * - **Typia tag incompatibilities**: Uses `satisfies ... as ...` pattern to strip 
   *   incompatible tags, or `typia.assert<T>()` as a last resort
   * - **Date conversions**: Uses `.toISOString()` method for Date to string conversions
   * - **Nullable type narrowing**: Applies exhaustive checks (e.g., !== null && !== undefined)
   * - **typia.assert vs assertGuard**: Uses assert for value assignment, assertGuard 
   *   for type narrowing
   * - **Literal type conversions**: Uses `typia.assert<T>()` for runtime validation
   * - **Optional chaining results**: Uses `=== true` or `??` operators
   * - **"No overlap" errors**: Removes redundant comparisons
   *
   * @param props - The analysis and correction properties
   * @param props.think - Analysis of the type casting issue found
   * @param props.draft - Initial corrected code with type fixes applied
   * @param props.revise - Review of corrections and final code
   */
  rewrite(props: IAutoBeCommonCorrectCastingApplication.IProps): void;

  /**
   * Reject function when error is not related to type casting or assignment.
   *
   * This function is called when the compilation error is unrelated to type 
   * casting issues (e.g., missing imports, syntax errors, undefined variables), 
   * indicating the error should be handled by a different agent.
   */
  reject(): void;
}
export namespace IAutoBeCommonCorrectCastingApplication {
  /**
   * Properties for the rewrite function containing the type casting error
   * analysis and correction workflow.
   */
  export interface IProps {
    /**
     * Initial analysis of the type casting or assignment error.
     *
     * Contains the agent's analysis of the specific type mismatch pattern:
     *
     * - Type of casting error (tag incompatibility, nullable assignment, literal 
     *   type conversion, etc.)
     * - Whether nullable or undefined types are involved
     * - If Date to string conversions are needed
     * - The chosen fix strategy for the specific error type
     */
    think: string;

    /**
     * Draft correction with initial type casting fixes.
     *
     * The code after applying the first round of fixes:
     *
     * - Satisfies patterns for tag stripping
     * - Date.toISOString() conversions where needed
     * - Nullable type narrowing checks
     * - Literal type assertions
     * - Optional chaining result handling
     */
    draft: string;

    /**
     * Review and finalization of type casting corrections.
     *
     * Contains the review of applied corrections and the final code with all
     * type casting issues resolved while preserving type safety and validation intent.
     */
    revise: IReviseProps;
  }

  /** Properties for the revision phase of type casting corrections. */
  export interface IReviseProps {
    /**
     * Review of the type casting correction patterns applied.
     *
     * Explains which correction strategies were used:
     *
     * - Which satisfies patterns were applied for tag issues
     * - Where typia.assert or assertGuard was used
     * - How Date conversions were handled
     * - What nullable type narrowing was applied
     * - How literal type conversions were resolved
     * - Confirmation that all type casting issues are resolved
     */
    review: string;

    /**
     * Final corrected code with all type casting issues resolved.
     *
     * The complete code ready for TypeScript compilation, with all type casting
     * and assignment errors properly fixed using appropriate patterns while
     * maintaining type safety and the original validation logic.
     */
    final: string;
  }
}
