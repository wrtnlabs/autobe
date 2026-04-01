import { AutoBeDatabase } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseCorrectApplication {
  process(props: IAutoBeDatabaseCorrectApplication.IProps): void;
}
export namespace IAutoBeDatabaseCorrectApplication {
  export interface IProps {
    thinking: string;
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  export interface IComplete {
    type: "complete";

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
     * Contains ONLY models mentioned in IAutoBeDatabaseValidation.IError[]
     * array. Each model has specific validation errors requiring targeted
     * correction. Models not mentioned in errors are excluded from this input.
     */
    models: AutoBeDatabase.IModel[];
  }
}
