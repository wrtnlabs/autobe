export interface IAutoBeCommonCorrectCastingApplication {
  /**
   * Rewrite function to fix severe syntax structure errors and type system
   * errors.
   *
   * Called when detecting:
   *
   * - **Severe syntax errors**: Nested declarations in object literals, malformed
   *   structures
   * - **Type system errors**: Typia tags, Date conversions, nullable narrowing,
   *   literal types
   * - **Escape sequence errors**: Double backslashes in JSON context
   *
   * @param props The analysis and correction properties
   */
  rewrite(props: IAutoBeCommonCorrectCastingApplication.IProps): void;

  /**
   * Reject function when error is outside scope.
   *
   * Called when error is unrelated (imports, undefined variables, business
   * logic). These errors are handled by subsequent agents.
   */
  reject(): void;
}
export namespace IAutoBeCommonCorrectCastingApplication {
  export interface IProps {
    /**
     * Analysis of syntax structure or type system error.
     *
     * Identifies error pattern and chosen fix strategy:
     *
     * - Syntax: Nested declarations, malformed structures
     * - Type: Tag incompatibility, nullable narrowing, Date conversions
     */
    think: string;

    /**
     * Draft code with initial syntax/type fixes applied.
     *
     * After first correction round:
     *
     * - Syntax: Flattened declarations, restructured code
     * - Type: Satisfies patterns, Date conversions, nullable checks
     */
    draft: string;

    /**
     * Review and final code with all errors resolved.
     *
     * Review of applied fixes and final code ready for compilation.
     */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Review of syntax/type correction patterns applied.
     *
     * Explains strategies used and confirms all errors resolved.
     */
    review: string;

    /**
     * Final corrected code ready for compilation.
     *
     * Code with all syntax/type errors fixed. Set to `null` when draft already
     * resolves all issues with no further refinements needed.
     */
    final: string | null;
  }
}
