import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetRealizeCollectors } from "../../common/structures/IAutoBePreliminaryGetRealizeCollectors";
import { IAutoBePreliminaryGetRealizeTransformers } from "../../common/structures/IAutoBePreliminaryGetRealizeTransformers";

export interface IAutoBeRealizeOperationCorrectApplication {
  /**
   * Process provider correction task or preliminary data requests.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
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
     * For completion: what did you acquire, what did you accomplish, why is it
     * sufficient? Summarize — don't enumerate every single item.
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union, physically preventing repeated calls.
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
