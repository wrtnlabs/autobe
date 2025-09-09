import { tags } from "typia";

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
    domain: string;

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
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Test implementation rules compliance validation.
     *
     * This property tracks whether each section of the TEST_WRITE.md guidelines
     * has been properly followed. Each array element represents a section from
     * the documentation with its title and compliance status.
     *
     * Note: The specific section titles may evolve as documentation updates, so
     * implementations should be flexible in handling different titles.
     *
     * Example:
     *
     * ```typescript
     * rules: [
     *   { title: "1. Role and Responsibility", state: true },
     *   { title: "2. Input Materials Provided", state: true },
     *   { title: "3. Code Generation Requirements", state: false },
     *   // ... other sections
     * ];
     * ```
     */
    rules: ICheck[] & tags.MinItems<1>;

    /**
     * Final quality checklist validation results.
     *
     * This property captures the compliance status for each item in the Final
     * Checklist (Section 5) from TEST_WRITE.md. Each array element represents a
     * checklist item with its description and validation result.
     *
     * Note: Checklist items may be updated over time, so implementations should
     * adapt to documentation changes while maintaining the validation purpose.
     *
     * Example:
     *
     * ```typescript
     * checkList: [
     *   { title: "NO additional import statements", state: true },
     *   { title: "NO wrong type data in requests", state: true },
     *   { title: "EVERY api.functional.* call has await", state: false },
     *   // ... other checklist items
     * ];
     * ```
     */
    checkList: ICheck[] & tags.MinItems<1>;

    /**
     * Step 4: Code review and quality assessment.
     *
     * **🚨 TWO TYPES OF REVISIONS: FIX AND DELETE 🚨**
     *
     * AI performs a thorough review of the draft implementation for:
     *
     * **1. FIX - Improve existing code:**
     *
     * **Compilation & Syntax:**
     * - TypeScript compilation errors and type mismatches
     * - Syntax errors and missing semicolons/brackets
     * - Correct function signatures and parameter types
     *
     * **Framework Compliance:**
     * - @nestia/e2e framework conventions adherence
     * - Proper API SDK function calling patterns
     * - Correct use of typia.assert() and TestValidator functions
     *
     * **Business Logic & Test Coverage:**
     * - Complete workflow implementation (authentication → data setup → main test → validation)
     * - Realistic business scenarios and user journeys
     * - Edge case handling and error condition testing
     * - Proper data dependencies and cleanup procedures
     *
     * **2. DELETE - Remove prohibited code entirely:**
     *
     * **🚨 TYPE ERROR TESTING - DELETE IMMEDIATELY 🚨**
     * - DELETE any code using `as any` to send wrong types
     * - DELETE any intentional type mismatches for "testing"
     * - DELETE any missing required fields testing
     * - DELETE tests that contradict compilation requirements
     *
     * **Code Quality & Security:**
     * - Type safety violations (any, @ts-ignore, etc.) - DELETE if found
     * - Variable naming and code organization - FIX if needed
     * - Performance considerations and resource management
     * - Security best practices in test data generation
     *
     * Workflow: Draft code → Systematic analysis → FIX or DELETE decisions
     *
     * The review must identify concrete issues with line-by-line feedback and
     * provide actionable solutions (FIX) or deletion instructions (DELETE) for
     * each problem discovered.
     *
     * **DO NOT FIX TYPE ERROR TESTS - DELETE THEM COMPLETELY**
     */
    review: string;

    /**
     * Step 5: Final production-ready test code.
     *
     * AI produces the final, polished version of the test code incorporating
     * all review feedback. This code represents the completed test
     * implementation, ready for production deployment.
     *
     * **🚨 CRITICAL: APPLY ALL FIXES AND DELETIONS FROM REVIEW 🚨**
     * - FIX all correctable issues identified in review
     * - DELETE all prohibited code identified in review
     * - If review found type error tests, they MUST be deleted in final
     * - If review found code to DELETE, final MUST be different from draft
     *
     * All identified issues must be resolved, and the code must meet the
     * highest quality standards.
     *
     * Workflow: Review feedback → Apply FIXES → Apply DELETIONS →
     * Production-ready implementation
     *
     * This is the ultimate deliverable that will be used in the actual test
     * suite.
     */
    final: string;
  }

  /**
   * Check validation item structure.
   *
   * Represents a validation check with its title and compliance state. Used for
   * both rules validation and final checklist validation.
   */
  export interface ICheck {
    /**
     * The title or description of the check.
     *
     * For rules: Section identifiers from TEST_WRITE.md (e.g., "1. Role and
     * Responsibility") For checklist: Checklist item descriptions (e.g., "No
     * compilation errors")
     */
    title: string;

    /**
     * The validation state of this check.
     *
     * - True: The requirement has been satisfied
     * - False: The requirement has been violated or not met
     */
    state: boolean;
  }
}
