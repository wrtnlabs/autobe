import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
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
   * Process operation function generation task.
   *
   * @param props Preliminary data request, write submission, or completion
   *   confirmation
   */
  process(props: IAutoBeRealizeOperationWriteApplication.IProps): void;
}

export namespace IAutoBeRealizeOperationWriteApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * For preliminary requests: what information is missing and why?
     *
     * For write: what you're submitting and key decisions made.
     *
     * For complete: why you consider the last write final.
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IWrite
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetRealizeCollectors
      | IAutoBePreliminaryGetRealizeTransformers
      | IAutoBePreliminaryComplete;
  }

  /** Generate operation implementation via plan/draft/revise. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

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
