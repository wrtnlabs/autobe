export interface IAutoBeRealizeCorrectApplication {
  /**
   * Systematically analyze and correct TypeScript compilation errors.
   *
   * Implements a three-phase workflow (think → draft → revise) that balances
   * efficiency for simple errors with thoroughness for complex problems.
   *
   * @param props Three-phase correction properties
   */
  correct(props: IAutoBeRealizeCorrectApplication.IProps): void;
}

export namespace IAutoBeRealizeCorrectApplication {
  export interface IProps {
    /**
     * Initial error analysis and correction strategy.
     *
     * Analyzes TypeScript compilation errors to understand:
     *
     * - Error patterns and root causes
     * - Required fixes and their impact
     * - Whether quick fixes or deep refactoring is needed
     * - Prisma schema and API contract constraints
     */
    think: string;

    /**
     * First correction attempt.
     *
     * Implements the initial fixes identified in the think phase. For simple
     * errors (typos, missing imports), this may be the final solution. Complex
     * errors may require further refinement.
     */
    draft: string;

    /**
     * Revision and finalization phase.
     *
     * Reviews the draft corrections and produces the final, error-free code
     * that maintains all business requirements.
     */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Correction review and validation.
     *
     * Analyzes the draft corrections to ensure:
     *
     * - All TypeScript errors are resolved
     * - Business logic remains intact
     * - AutoBE coding standards are maintained
     * - No new errors are introduced
     * - Performance and security are preserved
     */
    review: string;

    /**
     * Final error-free implementation.
     *
     * The complete, corrected code that passes all TypeScript compilation
     * checks.
     *
     * Returns `null` if the draft corrections are sufficient and need no
     * further changes.
     */
    final: string | null;
  }
}
