import { AutoBeDatabase } from "@autobe/interface";

import { IComplete } from "../../common/structures/IComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

/**
 * Function calling interface for the cyclinic write-compile-correct loop of
 * database schema correction.
 *
 * Combines preliminary context loading, correction submission with compiler
 * validation, and iterative correction into a single unified loop.
 *
 * The agent can:
 *
 * - Request context data (getAnalysisSections, getDatabaseSchemas, etc.)
 * - Submit corrected models via `write` for external validation
 * - Finalize via `complete` after a successful write validation
 */
export interface IAutoBeDatabaseCorrectApplication {
  /**
   * Process database correction, preliminary data requests, or finalization.
   *
   * Fixes validation errors in specific database models while preserving all
   * business logic and model descriptions. Submits corrected models via `write`
   * for external validation. If validation fails, diagnostics are provided and
   * you should correct and resubmit. Call `complete` only after a successful
   * write validation.
   *
   * @param props Request containing preliminary data request, write submission,
   *   or completion confirmation
   */
  process(props: IAutoBeDatabaseCorrectApplication.IProps): void;
}

export namespace IAutoBeDatabaseCorrectApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data, submitting corrections, or completing
     * your task, reflect on your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisSections, getDatabaseSchemas, etc.):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For write submissions:
     *
     * - If this is an initial correction, summarize the error analysis.
     * - If this is a re-correction, what remaining errors are you fixing and how?
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
     * - `write`: Submit corrected models for external validation
     * - `complete`: Finalize after successful write validation
     *
     * When preliminary returns empty array, that type is removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IWrite
      | IComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Submit corrected database models for external validation.
   *
   * The submitted models will be merged into the application and validated by
   * the database compiler. If validation fails, you will receive diagnostics in
   * the next iteration and should submit further corrections.
   */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /**
     * Detailed execution plan for fixing validation errors.
     *
     * Contains systematic reasoning and step-by-step error resolution approach
     * for targeted model validation issues.
     */
    planning: string;

    /**
     * Models with validation errors that need correction.
     *
     * Contains ONLY models mentioned in the validation errors. Each model has
     * specific validation errors requiring targeted correction. Models not
     * mentioned in errors are excluded.
     *
     * Output should return corrected versions of ONLY the affected models. All
     * business logic and descriptions must be preserved.
     */
    models: AutoBeDatabase.IModel[];
  }
}
