import { AutoBeInterfaceGroup } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";

export interface IAutoBeInterfaceGroupApplication {
  /** Process task or retrieve preliminary data. */
  process(props: IAutoBeInterfaceGroupApplication.IProps): void;
}

export namespace IAutoBeInterfaceGroupApplication {
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
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations;
  }

  /** Request to generate API endpoint groups. */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /** Analysis of the database schema structure and grouping needs. */
    analysis: string;

    /** Rationale for the group design decisions. */
    rationale: string;

    /**
     * Array of API endpoint groups. Derive from database schema organization
     * (namespaces, table prefixes), not arbitrary business domains. Provide
     * complete coverage without overlap.
     */
    groups: AutoBeInterfaceGroup[] & tags.MinItems<1>;
  }
}
