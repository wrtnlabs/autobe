import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetRealizeCollectors } from "../../common/structures/IAutoBePreliminaryGetRealizeCollectors";
import { IAutoBePreliminaryGetRealizeTransformers } from "../../common/structures/IAutoBePreliminaryGetRealizeTransformers";

/**
 * Function calling interface for generating API operation implementation
 * functions.
 *
 * Guides the AI agent through creating provider functions that implement
 * complete business logic for specific API endpoints. Each operation function
 * handles the full request-response lifecycle including validation,
 * authorization, database operations, and response formatting.
 *
 * The generation follows a structured RAG workflow: preliminary context
 * gathering (database schemas) → implementation planning → code generation →
 * review and refinement.
 */
export interface IAutoBeRealizeOperationWriteApplication {
  /**
   * Process operation function implementation task or preliminary data
   * requests.
   *
   * Generates complete operation function implementation through three-phase
   * workflow (plan → draft → revise). Ensures type safety, proper database query patterns,
   * and API contract compliance.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeRealizeOperationWriteApplication.IProps): void;
}

export namespace IAutoBeRealizeOperationWriteApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getDatabaseSchemas, etc.):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     *
     * - What key assets did you acquire?
     * - What did you accomplish?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every single item.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getDatabaseSchemas, getRealizeCollectors, getRealizeTransformers) or
     * final implementation generation (complete). When preliminary returns
     * empty array, that type is removed from the union, physically preventing
     * repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetRealizeCollectors
      | IAutoBePreliminaryGetRealizeTransformers;
  }

  /**
   * Request to generate operation function implementation.
   *
   * Executes three-phase generation to create complete operation
   * implementation. Follows plan → draft → revise pattern to ensure type
   * safety, proper database query patterns, and API contract compliance.
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * Operation implementation plan and strategy.
     *
     * Analyzes the operation function requirements, identifies related database
     * schemas, and outlines the implementation approach. Includes schema
     * validation and API contract verification.
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
     * - database query optimizations
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
