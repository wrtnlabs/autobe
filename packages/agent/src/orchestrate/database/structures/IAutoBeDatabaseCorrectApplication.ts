import { AutoBeDatabase } from "@autobe/interface";

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
   * 2. Submit corrected models via `write`
   *
   * @param props Request containing preliminary data request or write
   *   submission
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
     * For write submissions: summarize what errors you are fixing and how.
     */
    thinking: string;

    /**
     * Action to perform.
     *
     * Preliminary `getXxx` types are removed from the union once exhausted.
     */
    request:
      | IWrite
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /** Submit corrected models. */
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
