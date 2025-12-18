import { AutoBeTestPrepareMapping } from "@autobe/interface";

/**
 * Function calling interface for correcting test data preparation functions
 * with compilation errors.
 *
 * Guides the AI agent through analyzing compilation errors and generating
 * corrected prepare functions that generate realistic, constraint-compliant
 * test data for E2E testing. The correction process includes property mappings
 * as a Chain-of-Thought mechanism to ensure complete DTO coverage during
 * error resolution.
 *
 * The correction follows a structured workflow: error analysis → property
 * mappings (CoT mechanism) → draft correction → review and refinement.
 *
 * @author Michael
 * @author Samchon
 */
export interface IAutoBeTestPrepareCorrectOverallApplication {
  /**
   * Main entry point for AI Function Call - analyzes compilation errors and
   * generates corrected test data preparation function.
   *
   * The AI executes this function to perform the complete error correction
   * workflow: compilation error analysis → property mappings → draft correction
   * → code review → final corrected implementation. This multi-step process
   * ensures systematic error resolution while preserving original prepare
   * function functionality and maintaining complete DTO coverage.
   *
   * The corrector analyzes compilation diagnostics to identify specific issues,
   * maps all properties to ensure no omissions during correction, develops
   * correction strategies, and produces corrected code through iterative
   * refinement with comprehensive review and validation.
   *
   * @param props Complete specification for error correction workflow including
   *   analysis steps, property mappings, draft implementation, review process,
   *   and final code generation
   */
  rewrite(props: IAutoBeTestPrepareCorrectOverallApplication.IProps): void;
}

export namespace IAutoBeTestPrepareCorrectOverallApplication {
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
     * to fix errors while preserving the original prepare function purpose.
     * This analysis correlates error patterns with code structure to ensure
     * corrections address root causes rather than symptoms.
     *
     * This deep analysis forms the foundation for all subsequent correction
     * efforts, ensuring a methodical approach to resolving compilation issues.
     *
     * Workflow: Error diagnostic analysis → Root cause identification →
     * Correction strategy planning → Business logic preservation strategy
     */
    think: string;

    /**
     * Step 2: Property-by-property mapping table for complete DTO coverage.
     *
     * MUST include EVERY property from the DTO schema - no exceptions. Each
     * mapping specifies:
     *
     * - `property`: Exact property name from DTO schema
     * - `how`: How to generate the value for that property
     *
     * The `mappings` field is your Chain-of-Thought (CoT) mechanism - it forces
     * you to explicitly think through EVERY property before coding, preventing
     * omissions and incorrect data generation during error correction.
     *
     * Missing even a single property will cause validation failure and trigger
     * regeneration.
     *
     * This structured approach:
     *
     * - Prevents property omissions through systematic coverage
     * - Forces explicit decision-making for each property
     * - Enables validation before code generation
     * - Creates clear documentation of data generation strategy
     * - Ensures corrections maintain complete DTO coverage
     *
     * The validator will cross-check this list against the actual DTO schema
     * and reject incomplete mappings.
     */
    mappings: AutoBeTestPrepareMapping[];

    /**
     * Step 3: Draft corrected TypeScript prepare function implementation.
     *
     * AI generates the first corrected version of the prepare function based
     * on error analysis, property mappings, and correction strategies. This
     * draft addresses all identified compilation errors while preserving the
     * original data generation logic and ensuring complete DTO coverage.
     * The code is compilation-error-free and follows all established
     * conventions.
     *
     * The implementation incorporates lessons learned from error analysis and
     * strictly follows the property mappings to produce properly typed,
     * syntactically correct code that maintains the intended prepare function
     * functionality. All type safety requirements and framework conventions
     * are followed in this corrected implementation.
     *
     * Workflow: Error correction → Property mapping implementation →
     * TypeScript implementation → Functional preservation
     *
     * DO: Resolve all compilation errors while maintaining original prepare
     * function intent and complete DTO coverage
     */
    draft: string;

    /**
     * Step 4-5: Review and finalization process.
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

  /**
   * Revision properties for the final review and implementation phases.
   *
   * This interface encapsulates the final two steps of the error correction
   * workflow, ensuring systematic review and production-ready code delivery.
   */
  export interface IReviseProps {
    /**
     * Step 4: Code review and correction validation.
     *
     * AI performs a comprehensive review of the corrected draft implementation,
     * validating that all compilation errors have been resolved and that the
     * code maintains the original functionality with complete DTO coverage.
     * This review examines both technical correctness and data generation
     * logic preservation.
     *
     * The review process includes verification of TypeScript compilation
     * compatibility, property mapping completeness, constraint compliance,
     * nested structure handling correctness, and adherence to all quality
     * standards. Any remaining issues or potential improvements are identified
     * for incorporation into the final implementation.
     *
     * MUST systematically verify using these checklists:
     *
     * 1. Schema Fidelity - Cross-check EVERY property name against the DTO
     *    schema, verify all properties are generated, no fabricated properties
     * 2. Type Safety - DeepPartial<> used (not Partial<>), proper typing,
     *    correct nested handling
     * 3. Constraint Compliance - String lengths, number bounds, formats, enums
     * 4. Compilation Fix - All original compilation errors resolved
     *
     * Workflow: Draft validation → Compilation verification → Mapping coverage
     * review → Quality assessment
     */
    review: string;

    /**
     * Step 5: Final production-ready corrected prepare function code.
     *
     * AI produces the final, polished version of the corrected prepare
     * function code incorporating all review feedback and validation results.
     * This code represents the completed error correction, guaranteed to
     * compile successfully while preserving all original data generation
     * functionality and complete DTO coverage. When the draft correction
     * already perfectly resolves all issues with no problems found during
     * review, this value can be null, indicating no further refinement was
     * necessary.
     *
     * The final implementation resolves all compilation issues, maintains
     * strict type safety, follows all established conventions, covers all
     * DTO properties, and delivers a production-ready prepare function that
     * accurately generates realistic test data. A null value signifies the
     * draft correction was already optimal and requires no modifications.
     *
     * Workflow: Review integration → Final refinement → Production-ready
     * implementation (or null if draft needs no changes). This is the ultimate
     * deliverable that will replace the compilation-failed code when provided,
     * otherwise the draft correction is used as-is.
     */
    final: string | null;
  }
}
