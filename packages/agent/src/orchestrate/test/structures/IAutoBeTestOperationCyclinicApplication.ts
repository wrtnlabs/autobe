/**
 * Function calling interface for the cyclinic write-compile-correct loop of E2E
 * test operation implementation.
 *
 * Combines test code generation with compiler validation and iterative
 * correction into a single unified loop. No preliminary data requests are
 * needed for test operations.
 *
 * The agent can:
 *
 * - Submit test code via `write` for TypeScript compilation validation
 * - Finalize via `complete` after a successful write validation
 */
export interface IAutoBeTestOperationCyclinicApplication {
  /**
   * Process test operation code generation, correction, or finalization.
   *
   * Generates complete E2E test code through structured workflow. Submits code
   * via `write` for external TypeScript compilation validation. If validation
   * fails, diagnostics are provided and you should correct and resubmit. Call
   * `complete` only after a successful write validation.
   *
   * @param props Request containing write submission or completion confirmation
   */
  process(props: IAutoBeTestOperationCyclinicApplication.IProps): void;
}

export namespace IAutoBeTestOperationCyclinicApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before submitting code or completing your task, reflect on your current
     * state and explain your reasoning:
     *
     * For write submissions:
     *
     * - If this is an initial write, summarize your test strategy.
     * - If this is a correction, what compilation errors are you fixing and how?
     *
     * For completion:
     *
     * - Confirm that the last write passed validation successfully.
     *
     * This reflection helps you avoid repeated mistakes and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * - `write`: Submit test code for external validation (TypeScript
     *   compilation)
     * - `complete`: Finalize after successful write validation
     */
    request: IWrite | IComplete;
  }

  /**
   * Submit E2E test code for external validation.
   *
   * The submitted code will be compiled by the TypeScript compiler. If
   * compilation fails, you will receive diagnostics in the next iteration and
   * should submit corrected code.
   */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /**
     * Strategic test planning and scenario analysis.
     *
     * Analyze the given test scenario and create a comprehensive implementation
     * strategy. Define test methodology, data preparation, execution flow, and
     * validation logic.
     */
    scenario: string;

    /**
     * Functional domain classification for test organization.
     *
     * Determines the appropriate domain category based on the scenario
     * analysis. Must be a single, lowercase word in snake_case format that
     * represents the primary API resource.
     */
    domain: string;

    /**
     * Initial TypeScript E2E test code implementation.
     *
     * The first working version of the test code. Must be
     * compilation-error-free and follow @nestia/e2e framework conventions.
     *
     * Critical: NO import statements, start directly with 'export async
     * function'.
     */
    draft: string;

    /** Code review and final refinement process. */
    revise: IReviseProps;
  }

  /**
   * Confirm and finalize the test implementation.
   *
   * Only available after a write submission has passed TypeScript compilation
   * validation.
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * Confirmation that you want to finalize.
     *
     * Must be `true` to proceed with finalization.
     */
    are_you_sure: boolean;
  }

  export interface IReviseProps {
    /**
     * Code review and quality assessment.
     *
     * Review the draft for compilation errors, framework compliance, business
     * logic correctness, and test coverage completeness.
     */
    review: string;

    /**
     * Final production-ready test code.
     *
     * Returns `null` if the draft is already perfect and needs no changes.
     */
    final: string | null;
  }
}
