import { AutoBeDatabase } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseCorrectApplication {
  /**
   * Process schema correction task or preliminary data requests.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
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
     * For completion: what key assets did you acquire, what did you accomplish,
     * why is it sufficient? Summarize — don't enumerate every single item.
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
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Fix validation errors in affected models only, preserving design intent and
   * business logic.
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

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
