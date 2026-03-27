import { AutoBeDatabaseComponentTableDesign } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseComponentApplication {
  /** Process table design task or retrieve preliminary data. */
  process(props: IAutoBeDatabaseComponentApplication.IProps): void;
}

export namespace IAutoBeDatabaseComponentApplication {
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
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Complete the database component by filling in table designs for the given
   * skeleton.
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * Analysis of the component's scope, entities, relationships, and table
     * requirements.
     */
    analysis: string;

    /** Rationale for table design decisions and normalization choices. */
    rationale: string;

    /**
     * Table designs for this single component (snake_case, plural names).
     *
     * Namespace and filename are already determined by the skeleton. All tables
     * must belong to this component only.
     */
    tables: AutoBeDatabaseComponentTableDesign[];
  }
}
