export interface IAutoBeTestCorrectInvalidRequestApplication {
  /**
   * Rewrite function to remove code containing invalid type API requests.
   *
   * This function is called when the agent detects code that attempts to send
   * API requests with deliberately wrong types, causing TypeScript compilation
   * errors. The agent will remove the problematic code sections while
   * preserving valid test code.
   *
   * Common patterns that trigger this function:
   *
   * - TestValidator.error calls testing type violations
   * - Missing required fields with type assertions
   * - Wrong type assignments with satisfies operator
   * - Nested type violations in complex objects
   * - Partial type testing with invalid structures
   *
   * The rationale for deletion:
   *
   * - Type validation is the server's responsibility, not E2E tests
   * - TypeScript compiler should enforce type safety at compile time
   * - Invalid type testing breaks the entire test suite compilation
   * - E2E tests should focus on business logic, not type system violations
   *
   * @param props - The analysis and correction properties
   * @param props.think - Analysis of what specific invalid request pattern is
   *   causing the error
   * @param props.draft - Initial corrected code with problematic sections
   *   completely removed
   * @param props.revise - Review process and final cleaned code
   */
  rewrite(props: IAutoBeTestCorrectInvalidRequestApplication.IProps): void;

  /**
   * Reject function when no invalid type API requests are detected.
   *
   * This function is called when the compilation error is not related to
   * invalid API request types, indicating the agent should not intervene.
   *
   * Common scenarios for rejection:
   *
   * - Syntax errors unrelated to type violations
   * - Legitimate type mismatches that need fixing (not deletion)
   * - Framework-specific compilation issues
   * - Configuration or environment problems
   *
   * When called, this indicates that another specialized agent should handle
   * the compilation error, as it's outside this agent's domain.
   */
  reject(): void;
}

export namespace IAutoBeTestCorrectInvalidRequestApplication {
  /**
   * Properties for the rewrite function containing the analysis and correction
   * workflow.
   *
   * This follows a three-phase approach: think → draft → revise, ensuring
   * systematic removal of invalid type testing code while maintaining the
   * integrity of valid E2E tests.
   */
  export interface IProps {
    /**
     * Initial analysis phase.
     *
     * Contains the agent's analysis of what specific invalid request pattern
     * was found in the code and how it's causing the compilation error. This
     * should identify:
     *
     * - The exact pattern (as any, satisfies, TestValidator.error, etc.)
     * - Line numbers and locations of violations
     * - The TypeScript error codes being triggered
     * - Why this constitutes invalid type testing
     *
     * Example: "Detected TestValidator.error() call at line 45 with 'as any'
     * casting on request body containing deliberately wrong types (number for
     * email field). This is causing TS2345 compilation error."
     */
    think: string;

    /**
     * Draft correction phase.
     *
     * The initial corrected code with the problematic API request sections
     * completely removed while preserving all valid test code.
     *
     * Rules for drafting:
     *
     * - Remove entire test functions containing type violations
     * - Do not comment out code - delete it completely
     * - Preserve test suite structure and valid tests
     * - Maintain proper indentation and formatting
     * - Keep imports that are still needed by remaining code
     */
    draft: string;

    /**
     * Review and finalization phase.
     *
     * Contains the review of changes made and the final cleaned code that
     * should compile without the invalid API request errors. This ensures the
     * correction is complete and accurate.
     */
    revise: IReviseProps;
  }

  /**
   * Properties for the revision phase of the correction process.
   *
   * This phase ensures that the removal was complete and the remaining code is
   * valid and compilable.
   */
  export interface IReviseProps {
    /**
     * Review of the changes made.
     *
     * Brief explanation of what invalid API request code was removed and
     * verification that valid test code was preserved. Should confirm:
     *
     * - Which patterns were found and removed
     * - Line ranges that were deleted
     * - Verification that valid tests remain intact
     * - Confirmation that no partial fixes were applied
     *
     * Example: "Removed lines 43-52 containing TestValidator.error with invalid
     * type casting. Verified remaining tests are valid and unaffected."
     */
    review: string;

    /**
     * Final corrected code.
     *
     * The complete, cleaned test code with all invalid API request sections
     * removed, ready for compilation.
     *
     * This code must:
     *
     * - Compile without TypeScript errors
     * - Contain only valid business logic tests
     * - Have no `as any` or similar type violations
     * - Maintain the original file structure
     * - Be production-ready E2E test code
     */
    final: string;
  }
}
