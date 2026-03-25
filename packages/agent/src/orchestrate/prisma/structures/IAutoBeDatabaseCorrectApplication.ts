import { AutoBeDatabase } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IComplete } from "../../common/structures/IComplete";

/**
 * Function calling interface for the cyclinic write-validate-correct loop of
 * database schema correction.
 *
 * Combines preliminary context loading, corrected model submission with compiler
 * validation, and iterative correction into a single unified loop.
 *
 * The agent can:
 *
 * - Request context data (getAnalysisSections, getDatabaseSchemas, etc.)
 * - Submit corrected models via `write` for external Prisma validation
 * - Finalize via `complete` after a successful write validation
 */
export interface IAutoBeDatabaseCorrectApplication {
  /**
   * Process schema correction, preliminary data requests, or finalization.
   *
   * Fixes validation errors in specific database models while preserving all
   * business logic and model descriptions. Submits corrected models via `write`
   * for external Prisma validation. If validation fails, diagnostics are
   * provided and you should correct and resubmit. Call `complete` only after a
   * successful write validation.
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
     * - If this is an initial write, summarize your correction strategy.
     * - If this is a correction, what validation errors are you fixing and how?
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
     * - `write`: Submit corrected models for external validation (Prisma
     *   compilation)
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
   * The submitted models will be validated by the Prisma compiler. If
   * validation fails, you will receive diagnostics in the next iteration and
   * should submit corrected models.
   *
   * Returns ONLY models mentioned in validation errors. Models not mentioned
   * in errors must be excluded from the output.
   */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /**
     * Detailed execution plan for fixing validation errors.
     *
     * Contains systematic reasoning and step-by-step error resolution approach
     * for targeted model validation issues.
     *
     * Required planning content:
     *
     * 1. Error scope analysis:
     *
     *    - List all validation errors from IAutoBeDatabaseValidation.IError[]
     *    - Extract unique table names to identify affected models
     *    - Categorize errors by type (field duplications, references, types,
     *         indexes)
     *    - Identify which models need correction vs. remain unchanged
     * 2. Targeted fix strategy:
     *
     *    - Focus ONLY on models mentioned in validation errors
     *    - Outline minimal changes needed for each affected model
     *    - Plan cross-model reference updates without modifying non-error models
     *    - Ensure unchanged models maintain valid references to corrected models
     * 3. Model-specific fix plan:
     *
     *    - Model-by-model modification plan for ONLY affected models
     *    - Exact field additions, renames, or type corrections required
     *    - Reference updates within corrected models only
     *    - Index corrections limited to affected models
     * 4. Minimal scope validation:
     *
     *    - Confirm which models will be included in output (error models only)
     *    - List models that will remain unchanged in original schema
     *    - Identify cross-model dependencies without including unchanged models
     *    - Preserve all business logic within corrected models
     * 5. Targeted impact assessment:
     *
     *    - Potential effects of fixes on unchanged models (reference validation)
     *    - Verification points for corrected models only
     *    - Ensure no new validation errors in targeted models
     *    - Confirm minimal output scope compliance
     */
    planning: string;

    /**
     * Models with validation errors that need correction.
     *
     * Contains ONLY models mentioned in IAutoBeDatabaseValidation.IError[]
     * array. Each model has specific validation errors requiring targeted
     * correction. Models not mentioned in errors are excluded from this input.
     *
     * Expected validation issues:
     *
     * - Duplicate field/relation names within these specific models
     * - Invalid foreign key references from these models to other models
     * - Single foreign key fields in index arrays within these models
     * - Invalid naming conventions within these specific models
     * - Type validation errors in fields of these models
     *
     * Processing notes:
     *
     * - Input contains ONLY models with validation errors
     * - May reference other models not included in this input
     * - Cross-model references must be validated but target models won't be
     *   modified
     * - Output should return corrected versions of ONLY these input models
     * - All business logic and descriptions within these models must be preserved
     * - Corrections must not break references from unchanged models
     */
    models: AutoBeDatabase.IModel[];
  }
}
