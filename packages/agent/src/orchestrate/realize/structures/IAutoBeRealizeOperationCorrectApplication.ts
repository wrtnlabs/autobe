import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetRealizeCollectors } from "../../common/structures/IAutoBePreliminaryGetRealizeCollectors";
import { IAutoBePreliminaryGetRealizeTransformers } from "../../common/structures/IAutoBePreliminaryGetRealizeTransformers";

export interface IAutoBeRealizeOperationCorrectApplication {
  /**
   * Process provider correction task or preliminary data requests.
   *
   * @param props Preliminary data request, write submission, or completion
   *   confirmation
   */
  process(props: IAutoBeRealizeOperationCorrectApplication.IProps): void;
}

export namespace IAutoBeRealizeOperationCorrectApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * For preliminary requests: what critical information is missing and why?
     *
     * For write: what errors you're fixing and the correction strategy.
     *
     * For complete: why you consider all errors resolved.
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IWrite
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetRealizeCollectors
      | IAutoBePreliminaryGetRealizeTransformers
      | IAutoBePreliminaryComplete;
  }

  /** Correct provider compilation errors via think/draft/revise. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /**
     * Error analysis and correction strategy. Understand:
     *
     * - Error patterns and root causes
     * - Required fixes and their impact
     * - Whether quick fixes or deep refactoring is needed
     * - Database schema and API contract constraints
     */
    think: string;

    /** Corrected implementation applying all fixes from think phase. */
    draft: string;

    /** Reviews draft corrections and produces final error-free code. */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Verify corrections:
     *
     * - All TypeScript errors resolved
     * - Business logic remains intact
     * - No new errors introduced
     * - Performance and security preserved
     */
    review: string;

    /**
     * Final error-free code with all corrections applied, or null if draft
     * needs no changes.
     */
    final: string | null;
  }
}
