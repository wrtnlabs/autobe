import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetRealizeCollectors } from "../../common/structures/IAutoBePreliminaryGetRealizeCollectors";
import { IAutoBePreliminaryGetRealizeTransformers } from "../../common/structures/IAutoBePreliminaryGetRealizeTransformers";

export interface IAutoBeRealizeOperationCorrectApplication {
  /** Process task or retrieve preliminary data. */
  process(props: IAutoBeRealizeOperationCorrectApplication.IProps): void;
}

export namespace IAutoBeRealizeOperationCorrectApplication {
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
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetRealizeCollectors
      | IAutoBePreliminaryGetRealizeTransformers;
  }

  /** Correct provider compilation errors via think/draft/revise. */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /** Analyze error patterns, root causes, and required fixes. */
    think: string;

    /** Initial corrected implementation based on think phase analysis. */
    draft: string;

    /** Reviews draft and produces final error-free code. */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Verify all errors resolved, business logic intact, no regressions
     * introduced.
     */
    review: string;

    /** Final code, or null if draft needs no changes. */
    final: string | null;
  }
}
