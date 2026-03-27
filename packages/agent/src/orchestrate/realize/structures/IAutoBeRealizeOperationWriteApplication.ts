import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetRealizeCollectors } from "../../common/structures/IAutoBePreliminaryGetRealizeCollectors";
import { IAutoBePreliminaryGetRealizeTransformers } from "../../common/structures/IAutoBePreliminaryGetRealizeTransformers";

/**
 * Generates provider functions implementing business logic for API endpoints
 * via plan/draft/revise workflow.
 */
export interface IAutoBeRealizeOperationWriteApplication {
  /**
   * Process operation function generation task or preliminary data requests.
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
     * For preliminary requests: what critical information is missing and why?
     *
     * For completion: what key assets did you acquire, what did you accomplish,
     * why is it sufficient? Summarize — don't enumerate every single item.
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetRealizeCollectors
      | IAutoBePreliminaryGetRealizeTransformers;
  }

  /** Generate operation implementation via plan/draft/revise. */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * Operation implementation plan. Analyze requirements, identify related
     * database schemas, and outline implementation approach including schema
     * validation and API contract verification.
     */
    plan: string;

    /** First complete implementation attempt based on the plan. */
    draft: string;

    /** Reviews draft and produces final code. */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Identify improvements:
     *
     * - Type safety enhancements
     * - Database query optimizations
     * - Null/undefined handling corrections
     * - Authentication/authorization improvements
     * - Error handling refinements
     */
    review: string;

    /**
     * Final operation function code with all review improvements applied, or
     * null if draft needs no changes.
     */
    final: string | null;
  }
}
