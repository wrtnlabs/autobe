import { IAutoBeTypeScriptCompileResult } from "@autobe/interface";
import { tags } from "typia";

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
    think: IThinkProps;

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

  /**
   * Comprehensive compilation error analysis and correction planning
   * properties.
   *
   * This interface structures the AI's deep thinking process during error
   * correction, requiring individual analysis of each compilation error along
   * with an overall strategy assessment. The AI must meticulously examine every
   * error message, understand its root cause, and propose targeted solutions
   * while maintaining a holistic view of the correction process.
   *
   * The structure enforces granular error analysis while ensuring the AI
   * maintains awareness of overarching patterns and systemic issues that may
   * require broader strategic changes like scenario rewrites or architectural
   * adjustments.
   */
  export interface IThinkProps {
    /**
     * Individual analyses for each compilation diagnostic.
     *
     * Contains detailed examination of every compilation error encountered,
     * with specific analysis and targeted solutions. Each entry represents a
     * single compilation diagnostic that must be resolved. The AI must read
     * error messages meticulously, understand the exact nature of each problem,
     * and propose precise fixes based on the actual error content.
     *
     * This granular approach ensures no error is overlooked and each issue
     * receives appropriate attention and resolution strategy.
     */
    analyses: IDiagnosticAnalysis[] & tags.MinItems<1>;

    /**
     * Overall assessment of compilation issues and correction strategies.
     *
     * Synthesizes patterns across all individual errors to identify systemic
     * issues and overarching correction strategies. This includes verification
     * of TEST_WRITE.md and TEST_CORRECT.md compliance, assessment of whether
     * scenario rewrites are needed, identification of common error patterns,
     * and documentation of broad strategic decisions.
     *
     * Must address: type safety compliance, async/await patterns, scenario
     * adaptation requirements, and overall code quality considerations that
     * span multiple errors.
     */
    overall: string;
  }

  /**
   * Detailed analysis structure for individual compilation diagnostics.
   *
   * Represents the AI's systematic approach to understanding and resolving each
   * compilation diagnostic. Each diagnostic must be thoroughly analyzed to
   * understand its root cause, with a specific solution that addresses the
   * exact issue while maintaining type safety and code quality.
   */
  export interface IDiagnosticAnalysis {
    /**
     * The actual compilation diagnostic information from TypeScript compiler.
     *
     * Contains the complete diagnostic information including error message,
     * file location, error code, and severity. This raw data serves as the
     * foundation for analysis and must be read meticulously to understand the
     * exact nature of the compilation issue.
     *
     * **CRITICAL**: Use the compilation diagnostic input material EXACTLY as
     * provided. Copy the diagnostic object directly from the input without any
     * modifications, omissions, or reordering. Maintain the exact sequence of
     * diagnostics as they appear in the original compilation result.
     */
    diagnostic: IAutoBeTypeScriptCompileResult.IDiagnostic;

    /**
     * Root cause analysis of why this compilation error occurred.
     *
     * AI must examine the error message carefully and identify the specific
     * reason for failure. This includes understanding whether it's a missing
     * property, type mismatch, nullable/undefined issue, incorrect API usage,
     * or other TypeScript violations. The analysis should be precise and
     * fact-based, directly tied to the error message content.
     *
     * **MANDATORY**: The AI must thoroughly review ALL sections of TEST_CORRECT.md
     * and apply relevant error patterns and analysis guidelines from sections
     * 4.1-4.16 to ensure accurate diagnosis.
     *
     * Example: "Property 'code' is missing because the object literal lacks
     * this required field from ICommunityPlatformCommunity.ICreate interface"
     */
    analysis: string;

    /**
     * Specific solution to resolve this compilation error.
     *
     * Detailed correction strategy that addresses the exact issue identified in
     * the analysis. Solutions must be actionable, type-safe, and compliant with
     * all project guidelines. For nullable/undefined errors with typia tags,
     * immediately apply typia.assert(value!) pattern. For missing properties,
     * specify what will be added and how.
     *
     * **CRITICAL**: The AI must thoroughly review BOTH TEST_WRITE.md and
     * TEST_CORRECT.md before proposing solutions. All prohibitions from
     * TEST_WRITE.md must be strictly respected (no type bypasses, proper
     * async/await usage, etc.), and correction patterns from TEST_CORRECT.md
     * sections 4.1-4.16 must be properly applied.
     *
     * Example: "Add missing 'code' property using typia.random<string>() to
     * generate a valid string value that satisfies the interface requirement"
     */
    solution: string;
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
