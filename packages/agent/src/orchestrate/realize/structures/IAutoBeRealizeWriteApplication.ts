export interface IAutoBeRealizeWriteApplication {
  /**
   * Generate complete provider function implementation using Chain of Thinking.
   *
   * Follows a 3-phase process: plan → draft → revise.
   *
   * Ensures type safety, proper Prisma usage, and API contract compliance.
   *
   * @param props Chain of Thinking properties for implementation
   */
  write(props: IAutoBeRealizeWriteApplication.IProps): void;
}

export namespace IAutoBeRealizeWriteApplication {
  export interface IProps {
    /**
     * Implementation plan and strategy.
     *
     * Analyzes the provider function requirements, identifies related Prisma
     * schemas, and outlines the implementation approach. Includes schema
     * validation and API contract verification.
     */
    plan: string;

    /**
     * Initial implementation draft.
     *
     * The first complete implementation attempt based on the plan. May contain
     * areas that need refinement in the review phase.
     */
    draft: string;

    /**
     * Revision and finalization phase.
     *
     * Reviews the draft implementation and produces the final code with all
     * improvements and corrections applied.
     */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Review and improvement suggestions.
     *
     * Identifies areas for improvement in the draft code, including:
     *
     * - Type safety enhancements
     * - Prisma query optimizations
     * - Null/undefined handling corrections
     * - Authentication/authorization improvements
     * - Error handling refinements
     */
    review: string;

    /**
     * Final implementation code.
     *
     * The complete, production-ready implementation with all review suggestions
     * applied.
     *
     * Returns `null` if the draft is already perfect and needs no changes.
     */
    final: string | null;
  }
}
