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
    revise?: IReviseProps;
  }

  /**
   * Revision properties for the final review and implementation phases.
   *
   * This interface encapsulates the final two steps of the error correction
   * workflow, ensuring systematic review and production-ready code delivery.
   */
  export interface IReviseProps {
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
