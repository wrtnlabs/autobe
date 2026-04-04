import { AutoBeDatabaseComponentTableDesign } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
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
     * Reasoning: what's missing (preliminary), what you're submitting (write),
     * or why you're finalizing (complete).
     */
    thinking: string;

    /**
     * Action to perform. Exhausted preliminary types are removed from the
     * union.
     */
    request:
      | IWrite
      | IAutoBePreliminaryComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /** Submit database component table designs. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

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
