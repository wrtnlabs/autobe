import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";
import { IAutoBePreliminaryGetRealizeCollectors } from "../../common/structures/IAutoBePreliminaryGetRealizeCollectors";
import { IAutoBePreliminaryGetRealizeTransformers } from "../../common/structures/IAutoBePreliminaryGetRealizeTransformers";

export interface IAutoBeRealizeOperationCorrectApplication {
  /**
   * Process provider correction task or preliminary data requests.
   *
   * Systematically analyzes and corrects TypeScript compilation errors through
   * three-phase workflow (think → draft → revise). Maintains business logic
   * integrity while resolving all compilation issues.
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
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getPrismaSchemas, etc.):
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
     * (getPrismaSchemas) or final error correction (complete). When preliminary
     * returns empty array, that type is removed from the union, physically
     * preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetPrismaSchemas
      | IAutoBePreliminaryGetRealizeCollectors
      | IAutoBePreliminaryGetRealizeTransformers;
  }

  /**
   * Request to correct provider implementation errors.
   *
   * Executes three-phase error correction to resolve TypeScript compilation
   * issues in provider functions. Applies systematic fixes following think →
   * draft → revise pattern to ensure error-free production code.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval or actual
     * task execution. Value "complete" indicates this is the final task
     * execution request.
     */
    type: "complete";

    /**
     * Initial error analysis and correction strategy.
     *
     * Analyzes TypeScript compilation errors to understand:
     *
     * - Error patterns and root causes
     * - Required fixes and their impact
     * - Whether quick fixes or deep refactoring is needed
     * - Prisma schema and API contract constraints
     */
    think: string;

    /**
     * First correction attempt.
     *
     * Implements the initial fixes identified in the think phase. For simple
     * errors (typos, missing imports), this may be the final solution. Complex
     * errors may require further refinement.
     */
    draft: string;

    /**
     * Revision and finalization phase.
     *
     * Reviews the draft corrections and produces the final, error-free code
     * that maintains all business requirements.
     */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Correction review and validation.
     *
     * Analyzes the draft corrections to ensure:
     *
     * - All TypeScript errors are resolved
     * - Business logic remains intact
     * - AutoBE coding standards are maintained
     * - No new errors are introduced
     * - Performance and security are preserved
     */
    review: string;

    /**
     * Final error-free implementation.
     *
     * The complete, corrected code that passes all TypeScript compilation
     * checks.
     *
     * Returns `null` if the draft corrections are sufficient and need no
     * further changes.
     */
    final: string | null;
  }
}
