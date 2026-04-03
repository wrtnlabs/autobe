import { AutoBeDatabaseGroup } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseGroupApplication {
  /** Process group generation task or retrieve preliminary data. */
  process(props: IAutoBeDatabaseGroupApplication.IProps): void;
}

export namespace IAutoBeDatabaseGroupApplication {
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

  /** Submit database component groups for validation. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /**
     * Analysis of the requirements structure, domain organization, and
     * component needs.
     */
    analysis: string;

    /** Rationale for component grouping decisions and domain boundaries. */
    rationale: string;

    /**
     * Database component groups derived from business domains.
     *
     * Separate foundational groups (Systematic, Actors) from domain-specific
     * groups. Ensure complete coverage without overlap.
     */
    groups: AutoBeDatabaseGroup[] & tags.MinItems<1>;
  }
}

/** @deprecated Use IAutoBeDatabaseGroupApplication.IWrite instead. */
export type IAutoBeDatabaseGroupApplicationComplete =
  IAutoBeDatabaseGroupApplication.IWrite;
