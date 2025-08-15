export interface IAutoBeTestCorrectApplication {
  /**
   * Main entry point for AI Function Call - analyzes compilation errors and
   * generates corrected E2E test code.
   *
   * The AI executes this function to perform the complete error correction
   * workflow: error-free analysis → compilation error analysis → draft
   * correction → code review → final corrected implementation. This multi-step
   * process ensures systematic error resolution while preserving original test
   * functionality and maintaining code quality.
   *
   * The corrector first analyzes the scenario without considering compilation
   * errors to understand the intended functionality, then incorporates
   * compilation diagnostics to identify specific issues, and finally produces
   * corrected code through iterative refinement with comprehensive review and
   * validation.
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
     * Step 1: Initial analysis and understanding without compilation error
     * context.
     *
     * AI analyzes the original test scenario, business requirements, and
     * intended functionality without being influenced by compilation errors.
     * This clean analysis establishes a clear understanding of what the test
     * accomplishes, the expected business workflow, and the correct API
     * integration patterns.
     *
     * This step ensures that error correction doesn't lose sight of the
     * original test purpose and helps maintain the intended business logic
     * while addressing technical compilation issues. The AI develops a
     * comprehensive understanding of the test requirements before diving into
     * error-specific details.
     *
     * Workflow: Scenario understanding → Business logic analysis → Intended
     * functionality mapping
     */
    think_without_compile_error: string;

    /**
     * Step 2: Compilation error analysis and root cause identification.
     *
     * AI re-analyzes the scenario and implementation with full awareness of
     * compilation errors and diagnostic information. This step involves
     * systematic examination of error messages, identification of error
     * patterns, and understanding of how compilation issues relate to the
     * intended functionality.
     *
     * The AI correlates compilation diagnostics with the original requirements
     * to understand where the implementation diverged from correct TypeScript
     * usage while maintaining the business logic intent. This analysis forms
     * the foundation for targeted error correction strategies.
     *
     * Workflow: Error diagnostic analysis → Root cause identification →
     * Correction strategy planning
     */
    think_again_with_compile_error: string;

    /**
     * Step 3: Draft corrected TypeScript E2E test code implementation.
     *
     * AI generates the first corrected version of the test code based on error
     * analysis and correction strategies. This draft addresses all identified
     * compilation errors while preserving the original business logic and test
     * workflow. The code is compilation-error-free and follows all
     * established conventions.
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
     * Step 4: Code review and correction validation.
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
     * Step 5: Final production-ready corrected test code.
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
     * implementation This is the ultimate deliverable that will replace the
     * compilation-failed code.
     */
    final: string;
  }
}
