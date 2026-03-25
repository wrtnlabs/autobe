import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetRealizeCollectors } from "../../common/structures/IAutoBePreliminaryGetRealizeCollectors";
import { IAutoBePreliminaryGetRealizeTransformers } from "../../common/structures/IAutoBePreliminaryGetRealizeTransformers";

/** Generates provider functions implementing business logic for API endpoints. */
export interface IAutoBeRealizeOperationWriteApplication {
  /** Process task or retrieve preliminary data. */
  process(props: IAutoBeRealizeOperationWriteApplication.IProps): void;
}

export namespace IAutoBeRealizeOperationWriteApplication {
  export interface IProps {
    /**
     * Reasoning about your current state: what's missing (preliminary) or what
     * you accomplished (completion).
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union.
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
     * Analyze requirements, identify DB schemas, outline implementation
     * approach.
     */
    plan: string;

    /** First complete implementation attempt based on the plan. */
    draft: string;

    /** Reviews draft and produces final code. */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Identify improvements: type safety, query optimization, null handling,
     * auth, error handling.
     */
    review: string;

    /** Final code, or null if draft needs no changes. */
    final: string | null;
  }
}
