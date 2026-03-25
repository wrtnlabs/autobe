import { AutoBeDatabase } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseCorrectApplication {
  /** Process schema correction task or retrieve preliminary data. */
  process(props: IAutoBeDatabaseCorrectApplication.IProps): void;
}
export namespace IAutoBeDatabaseCorrectApplication {
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
     * Execution plan for fixing validation errors.
     *
     * Focus ONLY on models mentioned in validation errors. Plan minimal changes
     * per affected model, ensure cross-model references remain valid, and
     * preserve all business logic.
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
