export interface IAutoBeTestGenerationWriteApplication {
  /**
   * Main entry point for AI Function Call - generates resource generation
   * function.
   *
   * The AI executes this function to create a generation function that produces
   * test data resources for E2E testing. The generation function uses prepare
   * functions to create valid test data and calls the appropriate API to create
   * actual resources.
   *
   * @param props Complete specification for generation function including
   *   prepare function details, operation info, and implementation
   */
  generate(props: IAutoBeTestGenerationWriteApplication.IProps): void;
}

export namespace IAutoBeTestGenerationWriteApplication {
  export interface IProps {
    /**
     * Step 1: Strategic analysis and planning.
     *
     * AI analyzes the prepare function and corresponding API operation to
     * understand what resource needs to be generated and how. This analysis
     * includes understanding the prepare function's purpose, the API endpoint's
     * requirements, and the relationship between input data and output
     * resources.
     *
     * The analysis should identify:
     *
     * - What resource type is being created
     * - What SDK function to use for creation
     * - What input parameters the prepare function accepts
     * - How to use the prepare function output for API call
     * - Function naming strategy based on prepare function
     *
     * Workflow: Prepare function + Operation → Strategic analysis →
     * Implementation plan
     */
    think: string;

    /**
     * Step 2: Initial TypeScript generation function implementation.
     *
     * AI generates the first working version of the generation function that:
     *
     * 1. Accepts connection, optional input parameters (using the same DeepPartial
     *    type as prepare function), and optional URL parameters
     * 2. Calls the prepare function to create test data
     * 3. Uses the SDK to create the actual resource via API
     * 4. Returns the created resource
     *
     * The function must handle:
     *
     * - Proper typing with response type from operation.responseBody.typeName
     * - Correct import statements for types and functions
     * - Import path must use operation.responseBody.typeName exactly
     * - Passing input parameters to prepare function
     * - Handling URL parameters when required by the operation
     * - Error handling and async/await patterns
     *
     * Critical: Include ALL import statements required for the function
     *
     * Workflow: Strategic plan → TypeScript implementation → Functional
     * generation code
     */
    draft: string;

    /**
     * Steps 3-4: Code review and final refinement process.
     *
     * Contains the iterative improvement workflow that transforms the initial
     * draft into production-ready generation function code. The review phase
     * identifies issues to fix, followed by the final phase that produces the
     * polished implementation.
     *
     * Workflow: Draft → Review analysis → Final implementation
     */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Step 3: Code review and quality assessment.
     *
     * AI performs a thorough review of the draft implementation for:
     *
     * **Compilation & Syntax:**
     *
     * - TypeScript compilation errors and type mismatches
     * - Correct import statements and module references
     * - Proper function signatures and parameter types
     * - Import path format for types (must be
     *   @ORGANIZATION/PROJECT-api/lib/structures/{Namespace})
     *
     * **Functional Correctness:**
     *
     * - Correct use of prepare function with proper parameters
     * - Input type matches prepare function's input type (same DeepPartial type)
     * - Correct SDK function selection and usage
     * - Proper handling of optional input parameter passing
     * - Correct handling of URL parameters if required by the operation
     *
     * **Code Quality:**
     *
     * - Clear and consistent naming conventions
     * - Proper async/await patterns
     * - Error handling implementation
     * - Type safety without using 'any' type
     *
     * **Business Logic:**
     *
     * - Correct resource creation flow
     * - Proper data transformation from prepare to API input
     * - Response type MUST match operation.responseBody.typeName exactly
     *
     * Workflow: Draft code → Systematic analysis → Concrete improvement
     * suggestions
     *
     * The review must identify concrete issues with specific feedback and
     * provide actionable solutions for each problem discovered.
     */
    review: string;

    /**
     * Step 4: Final production-ready generation function code.
     *
     * AI produces the final, polished version of the generation function
     * incorporating all review feedback. This code represents the completed
     * implementation, ready for use in test scenarios. When the draft code is
     * already perfect with no issues found during review, this value can be
     * null, indicating no revisions were necessary.
     *
     * All identified issues must be resolved, and the code must meet the
     * highest quality standards. A null value indicates the draft code already
     * meets all requirements without modification.
     *
     * Workflow: Review feedback → Apply fixes → Production-ready implementation
     * (or null if no changes needed)
     *
     * This is the ultimate deliverable that will be used in the test generation
     * system when provided, otherwise the draft is used as-is.
     */
    final: string | null;
  }
}
