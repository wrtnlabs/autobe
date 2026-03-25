import { AutoBeDatabaseGroup } from "@autobe/interface";
import { tags } from "typia";

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

  /** Generate database component groups organized by business domains. */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

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
