export interface IAutoBeTestAuthorizationWriteApplication {
  /**
   * Main entry point for AI Function Call - generates authorization utility
   * functions.
   *
   * The AI executes this function to generate authorization functions that
   * handle authentication flows (login, join, refresh, etc.) for different
   * actor types. This structured approach ensures consistent authentication
   * handling across the test suite.
   *
   * @param props Complete specification for authorization function generation
   */
  write(props: IAutoBeTestAuthorizationWriteApplication.IProps): void;
}

export namespace IAutoBeTestAuthorizationWriteApplication {
  export interface IProps {
    /**
     * Step 1: Strategic authorization analysis.
     *
     * AI analyzes the operation to understand authorization requirements,
     * including the type of authentication flow, actor permissions, and required
     * SDK functions. This analysis forms the
     * foundation for generating appropriate authorization utilities.
     *
     * Workflow: Operation analysis → Authorization strategy → Implementation
     * plan
     */
    think: string;

    /**
     * Step 2: Actor identification.
     *
     * AI determines the actor (user type) for this authorization function.
     * This should be extracted from the context, such as the API path or
     * operation details.
     *
     * Examples: "user", "admin", "moderator", "seller", "customer"
     */
    actor: string;

    /**
     * Step 3: Function naming definition.
     *
     * AI determines the appropriate function name following the established
     * pattern: authorize_{actor}_{authType}. The name should clearly indicate
     * the actor role and authentication type for easy identification and use.
     *
     * Examples: authorize_admin_login, authorize_user_join,
     * authorize_guest_refresh
     */
    functionName: string;

    /**
     * Step 4: Initial authorization function implementation.
     *
     * AI generates the authorization utility function that properly handles the
     * authentication flow. The implementation must use correct SDK functions,
     * return required authentication
     * data, and include comprehensive error handling with fallback logic where
     * needed.
     *
     * Critical: NO import statements, start directly with 'export const'
     */
    draft: string;

    /**
     * Steps 5-6: Code review and final refinement process.
     *
     * Contains the iterative improvement workflow that transforms the initial
     * draft into production-ready authorization code. The review phase
     * identifies issues to fix, followed by the final phase that produces the
     * polished implementation ready for use in test scenarios.
     *
     * Workflow: Draft → Review analysis → Final implementation
     */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Step 5: Code review and quality assessment.
     *
     * AI performs a thorough review of the draft implementation, checking for:
     *
     * **Technical Correctness:**
     *
     * - Proper SDK function usage and parameter types
     * - Appropriate return types and data structures
     * - TypeScript compilation compatibility
     *
     * **Authorization Logic:**
     *
     * - Proper handling of authentication flows
     * - Correct token/session management
     * - Appropriate error handling and fallback strategies
     * - Security best practices
     *
     * **Code Quality:**
     *
     * - Clear variable naming and code organization
     * - Comprehensive error messages
     * - Proper async/await usage
     * - Type safety without any/unknown usage
     *
     * The review must provide specific, actionable feedback for improvements.
     */
    review: string;

    /**
     * Step 6: Final production-ready authorization function.
     *
     * AI produces the final version incorporating all review feedback. This
     * represents the completed authorization utility ready for use in test
     * scenarios. When the draft is already perfect with no issues found during
     * review, this value can be null.
     *
     * All identified issues must be resolved, and the code must meet production
     * quality standards for test utilities.
     *
     * Workflow: Review feedback → Apply improvements → Production-ready code
     * (or null if no changes needed)
     */
    final: string | null;
  }
}
