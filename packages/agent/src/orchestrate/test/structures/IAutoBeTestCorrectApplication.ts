// import { tags } from "typia";

// export interface ICheck {
//   /** The title or description of the validation rule/check item */
//   title: string;

//   /** The validation state (true: passed/satisfied, false: failed/violated) */
//   state: boolean;
// }

export interface IAutoBeTestCorrectApplication {
  /**
   * Main entry point for AI Function Call - analyzes compilation errors and
   * generates corrected E2E test code.
   *
   * The AI executes this function to perform the complete error correction
   * workflow: compilation error analysis → draft correction → code review →
   * final corrected implementation. This multi-step process ensures systematic
   * error resolution while preserving original test functionality and
   * maintaining code quality.
   *
   * The corrector analyzes compilation diagnostics to identify specific issues,
   * develops correction strategies, and produces corrected code through
   * iterative refinement with comprehensive review and validation.
   *
   * @param props Complete specification for error correction workflow including
   *   analysis steps, draft implementation, review process, and final code
   *   generation
   */
  rewrite(props: IAutoBeTestCorrectApplication.IProps): void;
}

export namespace IAutoBeTestCorrectApplication {
  export interface IProps {
    /**
     * Step 1: Deep compilation error analysis and correction strategy.
     *
     * AI performs comprehensive analysis of compilation errors to develop
     * targeted correction strategies. This step involves deep examination of
     * error messages, identification of error patterns, understanding root
     * causes, and planning systematic corrections.
     *
     * The AI examines each compilation diagnostic to understand where the
     * implementation diverged from correct TypeScript usage, identifies the
     * business logic intent behind the failed code, and formulates strategies
     * to fix errors while preserving the original test purpose. This analysis
     * correlates error patterns with code structure to ensure corrections
     * address root causes rather than symptoms.
     *
     * This deep analysis forms the foundation for all subsequent correction
     * efforts, ensuring a methodical approach to resolving compilation issues.
     *
     * Workflow: Error diagnostic analysis → Root cause identification →
     * Correction strategy planning → Business logic preservation strategy
     */
    think: string;

    /**
     * Step 2: Draft corrected TypeScript E2E test code implementation.
     *
     * AI generates the first corrected version of the test code based on error
     * analysis and correction strategies. This draft addresses all identified
     * compilation errors while preserving the original business logic and test
     * workflow. The code is compilation-error-free and follows all established
     * conventions.
     *
     * The implementation incorporates lessons learned from error analysis to
     * produce properly typed, syntactically correct code that maintains the
     * intended test functionality. All type safety requirements and framework
     * conventions are followed in this corrected implementation.
     *
     * Workflow: Error correction → TypeScript implementation → Functional
     * preservation
     *
     * DO: Resolve all compilation errors while maintaining original test intent
     */
    draft: string;

    /**
     * Step 3-4: Review and finalization process.
     *
     * Encapsulates the review and final implementation phases into a single
     * revision process. This structured approach ensures systematic validation
     * and refinement of the corrected code through comprehensive review
     * followed by production-ready implementation.
     *
     * The revision process maintains clear separation between review feedback
     * and final deliverable while ensuring all corrections are properly
     * validated and integrated.
     */
    revise: IReviseProps;
  }

  // /**
  //  * Comprehensive compilation error analysis and correction planning
  //  * properties.
  //  *
  //  * This interface structures the AI's deep thinking process during error
  //  * correction, requiring individual analysis of each compilation error along
  //  * with an overall strategy assessment. The AI must meticulously examine every
  //  * error message, understand its root cause, and propose targeted solutions
  //  * while maintaining a holistic view of the correction process.
  //  *
  //  * The structure enforces granular error analysis while ensuring the AI
  //  * maintains awareness of overarching patterns and systemic issues that may
  //  * require broader strategic changes like scenario rewrites or architectural
  //  * adjustments.
  //  */
  // export interface IThinkProps {
  //   /**
  //    * Individual analyses for each compilation diagnostic.
  //    *
  //    * Contains detailed examination of every compilation error encountered,
  //    * with specific analysis and targeted solutions. Each entry represents a
  //    * single compilation diagnostic that must be resolved. The AI must read the
  //    * IAutoBeTypeScriptCompileResult.IDiagnostic objects, interpret their
  //    * content, and provide human-readable summaries along with precise fixes.
  //    *
  //    * This granular approach ensures no error is overlooked and each issue
  //    * receives appropriate attention and resolution strategy.
  //    */
  //   analyses: IDiagnosticAnalysis[] & tags.MinItems<1>;

  //   /**
  //    * Overall assessment of compilation issues and correction strategies.
  //    *
  //    * Synthesizes patterns across all individual errors to identify systemic
  //    * issues and overarching correction strategies. This includes verification
  //    * of TEST_WRITE.md and TEST_CORRECT.md compliance, assessment of whether
  //    * scenario rewrites are needed, identification of common error patterns,
  //    * and documentation of broad strategic decisions.
  //    *
  //    * Must address: type safety compliance, async/await patterns, scenario
  //    * adaptation requirements, and overall code quality considerations that
  //    * span multiple errors.
  //    */
  //   overall: string;
  // }

  // /**
  //  * Detailed analysis structure for individual compilation diagnostics.
  //  *
  //  * Represents the AI's systematic approach to understanding and resolving each
  //  * compilation diagnostic. Each diagnostic must be thoroughly analyzed to
  //  * understand its root cause, with a specific solution that addresses the
  //  * exact issue while maintaining type safety and code quality.
  //  */
  // export interface IDiagnosticAnalysis {
  //   /**
  //    * AI-generated summary of the compilation diagnostic.
  //    *
  //    * The AI must analyze the `IAutoBeTypeScriptCompileResult.IDiagnostic`
  //    * object and provide a clear, concise summary of the error. This should
  //    * include the error message, file location, line/column position, and error
  //    * code in a human-readable format. The AI interprets and restructures the
  //    * raw diagnostic data to present it in a more understandable way.
  //    *
  //    * **IMPORTANT**: The AI should not copy the raw diagnostic object. Instead,
  //    * it must read and understand the diagnostic details, then compose a clear
  //    * string description that captures all essential information about the
  //    * error.
  //    */
  //   diagnostic: string;

  //   /**
  //    * Root cause analysis of why this compilation error occurred.
  //    *
  //    * **🚨 CRITICAL FIRST CHECK: Is this caused by INTENTIONAL TYPE ERROR TESTING? 🚨**
  //    * - Look for `as any` usage in the error location
  //    * - Check if code is intentionally sending wrong types to test type validation
  //    * - Check if code is testing missing required fields
  //    * - **IF YES → Root cause: "Prohibited type error testing code that must be DELETED"**
  //    *
  //    * **⚠️ THINK BEYOND THE DIAGNOSTIC LINE - EXPAND YOUR INVESTIGATION ⚠️**
  //    * - Do NOT focus only on the error line - it might be just a symptom
  //    * - The real cause might be ABOVE the error location in earlier code
  //    * - The test scenario itself might be fundamentally flawed or impossible
  //    * - Consider if the scenario is requesting non-existent APIs or prohibited actions
  //    * - Example: Error on line 50 might be caused by wrong type assignment on line 20
  //    * - Example: API call fails because the scenario describes unimplemented functionality
  //    *
  //    * AI must examine the error message carefully and identify the specific
  //    * reason for failure. This includes understanding whether it's a missing
  //    * property, type mismatch, nullable/undefined issue, incorrect API usage,
  //    * intentional type error testing, flawed scenario, or other TypeScript
  //    * violations. The analysis should be precise and fact-based, but also
  //    * consider the broader context and causal relationships.
  //    *
  //    * **MANDATORY**: The AI must thoroughly review ALL sections of
  //    * TEST_CORRECT.md and apply relevant error patterns and analysis guidelines
  //    * from sections 4.1-4.16 to ensure accurate diagnosis.
  //    *
  //    * Example: "Property 'code' is missing because the object literal lacks
  //    * this required field from ICommunityPlatformCommunity.ICreate interface"
  //    *
  //    * Example: "Type error caused by intentional wrong type test using 'as any'
  //    * - prohibited pattern that must be deleted"
  //    *
  //    * Example: "API endpoint doesn't exist - scenario requests unimplemented
  //    * functionality that cannot be tested"
  //    */
  //   analysis: string;

  //   /**
  //    * Specific solution to resolve this compilation error.
  //    *
  //    * **🚨 IF ROOT CAUSE IS TYPE ERROR TESTING → Solution: "DELETE entire test block" 🚨**
  //    * **🚨 IF PROBLEM IS UNRECOVERABLE → Solution: "DELETE the problematic section" 🚨**
  //    * - NEVER try to "fix" intentional type error tests - DELETE them
  //    * - NEVER violate type safety to force a fix - DELETE instead
  //    * - Tests using `as any` to send wrong types must be DELETED
  //    * - Tests checking type validation must be DELETED
  //    * - Unrecoverable compilation errors should result in DELETION
  //    *
  //    * **THREE SOLUTION TYPES:**
  //    * 1. **FIX**: Correct the error while maintaining functionality
  //    * 2. **DELETE**: Remove prohibited or unrecoverable code entirely
  //    * 3. **REWRITE**: Restructure if the scenario itself is fundamentally flawed
  //    *
  //    * Detailed correction strategy that addresses the exact issue identified in
  //    * the analysis. Solutions must be actionable, type-safe, and compliant with
  //    * all project guidelines. For nullable/undefined errors with typia tags,
  //    * immediately apply typia.assert(value!) pattern. For missing properties,
  //    * specify what will be added and how.
  //    *
  //    * **CRITICAL**: The AI must thoroughly review BOTH TEST_WRITE.md and
  //    * TEST_CORRECT.md before proposing solutions. All prohibitions from
  //    * TEST_WRITE.md must be strictly respected (no type bypasses, proper
  //    * async/await usage, etc.), and correction patterns from TEST_CORRECT.md
  //    * sections 4.1-4.16 must be properly applied.
  //    *
  //    * **DELETION IS A VALID SOLUTION** when:
  //    * - Code violates absolute prohibitions
  //    * - Fixing would require type safety violations
  //    * - The scenario describes impossible functionality
  //    * - Multiple fix attempts have failed
  //    *
  //    * Example: "Add missing 'code' property using typia.random<string>() to
  //    * generate a valid string value that satisfies the interface requirement"
  //    *
  //    * Example: "DELETE this entire test - it's testing type errors with 'as any'"
  //    *
  //    * Example: "DELETE this section - API endpoint doesn't exist and cannot be
  //    * tested without violating type safety"
  //    */
  //   solution: string;
  // }

  /**
   * Revision properties for the final review and implementation phases.
   *
   * This interface encapsulates the final two steps of the error correction
   * workflow, ensuring systematic review and production-ready code delivery.
   */
  export interface IReviseProps {
    // /**
    //  * Dual-document compliance validation for TEST_WRITE.md and
    //  * TEST_CORRECT.md.
    //  *
    //  * This property tracks whether each section from BOTH TEST_WRITE.md and
    //  * TEST_CORRECT.md guidelines has been properly followed. Since the correct
    //  * agent must ensure compliance with both documents, keys should include
    //  * sections from both prompt files.
    //  *
    //  * Each ICheck item should have:
    //  *
    //  * - Title: Prefixed with source document for clarity ("TEST_WRITE: " or
    //  *   "TEST_CORRECT: ")
    //  * - State: Compliance status (true if followed, false if violated)
    //  *
    //  * Note: Section identifiers may evolve as documentation updates, so
    //  * implementations should be flexible in handling different key formats.
    //  *
    //  * Example:
    //  *
    //  * ```typescript
    //  * rules: [
    //  *   { title: "TEST_WRITE: 1. Role and Responsibility", state: true },
    //  *   { title: "TEST_WRITE: 3.1. Import Management", state: true },
    //  *   {
    //  *     title: "TEST_CORRECT: 4.1. Missing Properties Pattern",
    //  *     state: true,
    //  *   },
    //  *   {
    //  *     title: "TEST_CORRECT: 4.2. Type Mismatch Pattern",
    //  *     state: false,
    //  *   },
    //  *   // ... other sections from both documents
    //  * ];
    //  * ```
    //  */
    // rules: ICheck[] & tags.MinItems<1>;

    // /**
    //  * Combined quality checklist validation from both prompt documents.
    //  *
    //  * This property captures the compliance status for checklist items from
    //  * BOTH TEST_WRITE.md (Section 5: Final Checklist) and TEST_CORRECT.md
    //  * (Section 5: Final Review Checklist). The correct agent must validate
    //  * against both checklists to ensure comprehensive quality control.
    //  *
    //  * Each ICheck item should have:
    //  *
    //  * - Title: Checklist item as described in the documents
    //  * - State: Whether the criterion has been satisfied
    //  *
    //  * Note: Checklist items may be updated over time, so implementations should
    //  * adapt to documentation changes while maintaining the validation purpose.
    //  *
    //  * Example:
    //  *
    //  * ```typescript
    //  * checkList: [
    //  *   { title: "No compilation errors", state: true },
    //  *   { title: "Proper async/await usage", state: true },
    //  *   { title: "All typia tags preserved", state: true },
    //  *   { title: "No type bypasses or workarounds", state: false },
    //  *   // ... other checklist items from both documents
    //  * ];
    //  * ```
    //  */
    // checkList: ICheck[] & tags.MinItems<1>;

    /**
     * Step 3: Code review and correction validation.
     *
     * AI performs a comprehensive review of the corrected draft implementation,
     * validating that all compilation errors have been resolved and that the
     * code maintains the original functionality. This review examines both
     * technical correctness and business logic preservation.
     *
     * The review process includes verification of TypeScript compilation
     * compatibility, API integration correctness, test workflow completeness,
     * and adherence to all quality standards. Any remaining issues or potential
     * improvements are identified for incorporation into the final
     * implementation.
     *
     * Workflow: Draft validation → Compilation verification → Functionality
     * review → Quality assessment
     */
    review: string;

    /**
     * Step 4: Final production-ready corrected test code.
     *
     * AI produces the final, polished version of the corrected test code
     * incorporating all review feedback and validation results. This code
     * represents the completed error correction, guaranteed to compile
     * successfully while preserving all original test functionality and
     * business logic.
     *
     * The final implementation resolves all compilation issues, maintains
     * strict type safety, follows all established conventions, and delivers a
     * production-ready test that accurately validates the intended API
     * behaviors and user workflows.
     *
     * Workflow: Review integration → Final refinement → Production-ready
     * implementation. This is the ultimate deliverable that will replace the
     * compilation-failed code.
     */
    final: string;
  }
}
