import { IAutoBeCyclinicComplete } from "../../common/structures/IAutoBeCyclinicComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetRealizeCollectors } from "../../common/structures/IAutoBePreliminaryGetRealizeCollectors";
import { IAutoBePreliminaryGetRealizeTransformers } from "../../common/structures/IAutoBePreliminaryGetRealizeTransformers";

/**
 * Function calling interface for the cyclinic write-compile-correct loop of API
 * operation implementation.
 *
 * Combines preliminary context loading, code submission with compiler
 * validation, and iterative correction into a single unified loop.
 *
 * The agent can:
 *
 * - Request context data (getAnalysisSections, getDatabaseSchemas, etc.)
 * - Submit code via `write` for external TypeScript compilation
 * - Finalize via `complete` after a successful write validation
 */
export interface IAutoBeRealizeOperationWriteApplication {
  /**
   * Process operation function implementation, correction, or preliminary data
   * requests.
   *
   * Generates complete operation function implementation through structured
   * workflow. Submits code via `write` for external validation (compilation).
   * If validation fails, diagnostics are provided and you should correct and
   * resubmit. Call `complete` only after a successful write validation.
   *
   * @param props Request containing preliminary data request, write submission,
   *   or completion confirmation
   */
  process(props: IAutoBeRealizeOperationWriteApplication.IProps): void;
}

export namespace IAutoBeRealizeOperationWriteApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data, submitting code, or completing your
     * task, reflect on your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisSections, getDatabaseSchemas, etc.):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For write submissions:
     *
     * - If this is an initial write, summarize your implementation plan.
     * - If this is a correction, what errors are you fixing and how?
     *
     * For completion:
     *
     * - Confirm that the last write passed validation successfully.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform:
     *
     * - Preliminary types: Load context data incrementally
     * - `write`: Submit code for external validation (TypeScript compilation)
     * - `complete`: Finalize after successful write validation
     *
     * When preliminary returns empty array, that type is removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IWrite
      | IAutoBeCyclinicComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetRealizeCollectors
      | IAutoBePreliminaryGetRealizeTransformers;
  }

  /**
   * Submit operation function code for external validation.
   *
   * The submitted code will be compiled by the TypeScript compiler. If
   * compilation fails, you will receive diagnostics in the next iteration and
   * should submit corrected code.
   *
   * Follows plan → draft → revise pattern to ensure type safety, proper
   * database query patterns, and API contract compliance.
   */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /**
     * Operation implementation plan and strategy.
     *
     * For initial writes: analyze requirements and outline the implementation
     * approach including schema validation and API contract verification.
     *
     * For corrections: identify error patterns, root causes, and the correction
     * strategy.
     */
    plan: string;

    /**
     * Initial implementation draft.
     *
     * The first complete implementation attempt based on the plan. May contain
     * areas that need refinement in the review phase.
     */
    draft: string;

    /**
     * Revision and finalization phase.
     *
     * Reviews the draft implementation and produces the final code with all
     * improvements and corrections applied.
     */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Review and improvement suggestions.
     *
     * Identifies areas for improvement in the draft code, including:
     *
     * - Type safety enhancements
     * - Database query optimizations
     * - Null/undefined handling corrections
     * - Authentication/authorization improvements
     * - Error handling refinements
     */
    review: string;

    /**
     * Final operation function code.
     *
     * The complete, production-ready implementation with all review suggestions
     * applied.
     *
     * Returns `null` if the draft is already perfect and needs no changes.
     */
    final: string | null;
  }
}
