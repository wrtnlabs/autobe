import { AutoBeDatabaseComponentTableRevise } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseAuthorizationReviewApplication {
  /** Process authorization review task or retrieve preliminary data. */
  process(props: IAutoBeDatabaseAuthorizationReviewApplication.IProps): void;
}

export namespace IAutoBeDatabaseAuthorizationReviewApplication {
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

  /** Submit table revisions after authentication requirements analysis. */
  export interface IComplete {
    /** Type discriminator. Value "complete" indicates final submission. */
    type: "complete";

    /**
     * How authentication requirements map to proposed table modifications,
     * identifying coverage gaps.
     */
    review: string;

    /**
     * Table revision operations (create/update/erase). Each must include a
     * reason.
     *
     * Constraints:
     *
     * - Only CREATE tables related to authentication and authorization
     * - Each actor MUST have a main actor table and session table
     * - Empty array is valid if no modifications are needed
     *
     * Naming: snake_case, plural, domain-prefixed, actor name in table.
     */
    revises: AutoBeDatabaseComponentTableRevise[];
  }
}
