import { AutoBeDatabase } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseCorrectApplication {
  /**
   * Process schema correction task or preliminary data requests.
   *
   * Workflow:
   *
   * 1. Request preliminary context if needed (getAnalysisSections, etc.)
   * 2. Submit corrected models via `write` — can be called multiple times to
   *    refine corrections
   * 3. Finalize via `complete` after you are satisfied with the submitted models
   *
   * @param props Request containing preliminary data request, write submission,
   *   or completion signal
   */
  process(props: IAutoBeDatabaseCorrectApplication.IProps): void;
}
export namespace IAutoBeDatabaseCorrectApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * For preliminary requests: what critical information is missing and why?
     * Be brief — state the gap, don't list everything you have.
     *
     * For write submissions: summarize what errors you are fixing and how. If
     * this is a revision, explain what changed from the previous submission.
     *
     * For completion: why you consider the last write submission final.
     */
    thinking: string;

    /**
     * Action to perform.
     *
     * - Preliminary `getXxx` types are removed from the union once exhausted.
     * - `complete` is only available after at least one `write` submission.
     */
    request:
      | IWrite
      | IAutoBePreliminaryComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Submit corrected models for validation errors.
   *
   * This is an intermediate step — you can submit multiple times to refine your
   * corrections. The last submitted models will be used when you call
   * `complete`.
   */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /**
     * Execution plan for fixing validation errors. Required steps:
     *
     * 1. Error scope analysis — list all validation errors, extract affected table
     *    names, categorize by type (duplications, references, types, indexes)
     * 2. Targeted fix strategy — focus ONLY on models in errors, outline minimal
     *    changes per model
     * 3. Model-specific fix plan — detail corrections per affected model
     * 4. Minimal scope validation — confirm which models are in/out of output
     * 5. Targeted impact assessment — verify fixes don't break references from
     *    unchanged models
     *
     * Preserve all business logic and cross-model references.
     */
    planning: string;

    /**
     * Models with validation errors that need correction.
     *
     * Contains ONLY models from IAutoBeDatabaseValidation.IError[]. Output
     * corrected versions of these models only. Cross-model references must stay
     * valid but target models are not modified.
     */
    models: AutoBeDatabase.IModel[];
  }
}
