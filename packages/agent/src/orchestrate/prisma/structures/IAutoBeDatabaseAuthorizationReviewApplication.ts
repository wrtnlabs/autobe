import { AutoBeDatabaseComponentTableRevise } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
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

  /** Submit table revisions for validation. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

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

/** @deprecated Use IAutoBeDatabaseAuthorizationReviewApplication.IWrite instead. */
export type IAutoBeDatabaseAuthorizationReviewApplicationComplete =
  IAutoBeDatabaseAuthorizationReviewApplication.IWrite;
