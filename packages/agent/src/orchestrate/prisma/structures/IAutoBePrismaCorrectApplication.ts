import { AutoBePrisma } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBePrismaCorrectApplication {
  /**
   * Process schema correction task or preliminary data requests.
   *
   * Fixes validation errors in specific Prisma models while preserving all
   * business logic and model descriptions. Returns ONLY corrected models.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBePrismaCorrectApplication.IProps): void;
}
export namespace IAutoBePrismaCorrectApplication {
  export interface IProps {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles, getPrismaSchemas) or final schema correction
     * (complete). When preliminary returns empty array, that type is removed
     * from the union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPrismaSchemas;
  }

  /**
   * Request to fix validation errors in Prisma models.
   *
   * Executes targeted error correction to resolve specific validation issues in
   * affected models only. Applies minimal changes while preserving original
   * design intent and business logic.
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
     * Detailed execution plan for fixing validation errors.
     *
     * Contains systematic reasoning and step-by-step error resolution approach
     * for targeted model validation issues.
     *
     * Required planning content:
     *
     * 1. Error scope analysis:
     *
     *    - List all validation errors from IAutoBePrismaValidation.IError[]
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
     * Contains ONLY models mentioned in IAutoBePrismaValidation.IError[] array.
     * Each model has specific validation errors requiring targeted correction.
     * Models not mentioned in errors are excluded from this input.
     *
     * Expected validation issues:
     *
     * - Duplicate field/relation names within these specific models
     * - Invalid foreign key references from these models to other models
     * - Single foreign key fields in index arrays within these models
     * - Invalid naming conventions within these specific models
     * - Type validation errors in fields of these models
     *
     * Model content analysis:
     *
     * - Complete field definitions for each error model only
     * - Relationships from these models (may reference unchanged models)
     * - Indexes within these models that need correction
     * - Business descriptions specific to these models
     * - Cross-model references that need validation (read-only for targets)
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
    models: AutoBePrisma.IModel[];
  }
}
