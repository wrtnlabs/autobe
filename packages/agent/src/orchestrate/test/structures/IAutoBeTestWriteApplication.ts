import { SnakePattern } from "@autobe/interface";

export interface IAutoBeTestWriteApplication {
  /**
   * Main entry point for AI Function Call - generates complete E2E test code.
   *
   * The AI executes this function to perform the entire test generation
   * workflow: scenario analysis → draft implementation → code review → final
   * code production. This structured approach ensures high-quality,
   * compilation-error-free test code.
   *
   * @param props Complete specification for test generation including scenario,
   *   domain, and implementation steps
   */
  write(props: IAutoBeTestWriteApplication.IProps): void;
}

export namespace IAutoBeTestWriteApplication {
  export interface IProps {
    /**
     * Step 1: Strategic test planning and scenario analysis.
     *
     * AI analyzes the given test scenario and creates a comprehensive
     * implementation strategy. This planning phase is crucial for generating
     * well-structured, maintainable test code. The AI must define test
     * methodology, data preparation, execution flow, and validation logic
     * before proceeding to code implementation.
     *
     * Workflow: Input scenario → Strategic analysis → Detailed test plan
     */
    scenario: string;

    /**
     * Step 2: Functional domain classification for test organization.
     *
     * AI determines the appropriate domain category based on the scenario
     * analysis. This classification drives file structure, test categorization,
     * and logical grouping. The domain must be a single, lowercase word in
     * snake_case format that represents the primary API resource.
     *
     * Workflow: Scenario analysis → Domain identification → Test organization
     * structure
     */
    domain: string & SnakePattern;

    /**
     * Step 3: Initial TypeScript E2E test code implementation.
     *
     * AI generates the first working version of the test code based on the
     * strategic plan. This draft must be compilation-error-free and follow
     *
     * @nestia/e2e framework conventions. The code should implement all planned
     * test scenarios with proper async/await patterns, type safety, and
     * comprehensive error handling.
     *
     * Workflow: Strategic plan → TypeScript implementation → Functional test
     * code
     *
     * Critical: NO import statements, start directly with 'export async function'
     */
    draft: string;

    /**
     * Steps 4-5: Code review and final refinement process.
     *
     * Contains the iterative improvement workflow that transforms the initial
     * draft into production-ready test code. This two-phase process ensures
     * systematic quality enhancement through comprehensive review followed by
     * targeted refinement based on identified issues.
     *
     * Workflow: Draft → Review analysis → Final implementation
     */
    revise?: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Step 4: Code review and quality assessment.
     *
     * AI performs a thorough review of the draft implementation, examining:
     *
     * **Compilation & Syntax:**
     *
     * - TypeScript compilation errors and type mismatches
     * - Syntax errors and missing semicolons/brackets
     * - Correct function signatures and parameter types
     *
     * **Framework Compliance:**
     *
     * - @nestia/e2e framework conventions adherence
     * - Proper API SDK function calling patterns
     * - Correct use of typia.assert() and TestValidator functions
     *
     * **Business Logic & Test Coverage:**
     *
     * - Complete workflow implementation (authentication → data setup → main test
     *   → validation)
     * - Realistic business scenarios and user journeys
     * - Edge case handling and error condition testing
     * - Proper data dependencies and cleanup procedures
     *
     * **Code Quality & Security:**
     *
     * - Type safety violations (any, @ts-ignore, etc.)
     * - Variable naming and code organization
     * - Performance considerations and resource management
     * - Security best practices in test data generation
     *
     * Workflow: Draft code → Systematic analysis → Specific improvement
     * recommendations
     *
     * The review must identify concrete issues with line-by-line feedback and
     * provide actionable solutions for each problem discovered.
     */
    review: string;

    /**
     * Step 5: Final production-ready test code.
     *
     * AI produces the final, polished version of the test code incorporating
     * all review feedback. This code represents the completed test
     * implementation, ready for production deployment. All identified issues
     * must be resolved, and the code must meet the highest quality standards.
     *
     * Workflow: Review feedback → Code refinement → Production-ready
     * implementation
     *
     * This is the ultimate deliverable that will be used in the actual test
     * suite.
     */
    final: string;
  }
}
