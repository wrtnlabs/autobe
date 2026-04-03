import { AutoBeInterfaceGroup } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
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
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations;
  }

  /** Submit API endpoint groups. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

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

/** @deprecated Use IAutoBeInterfaceGroupApplication.IWrite instead. */
export type IAutoBeInterfaceGroupApplicationComplete =
  IAutoBeInterfaceGroupApplication.IWrite;
