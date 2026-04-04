import { AutoBeDatabaseComponentTableRevise } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseComponentReviewApplication {
  /** Process component review task or retrieve preliminary data. */
  process(props: IAutoBeDatabaseComponentReviewApplication.IProps): void;
}

export namespace IAutoBeDatabaseComponentReviewApplication {
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

  /** Submit table revisions. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

    /**
     * How requirements map to proposed table modifications, identifying
     * coverage gaps.
     */
    review: string;

    /**
     * Table revision operations (create/update/erase). Each must include a
     * reason.
     *
     * Constraints:
     *
     * - Only CREATE tables that clearly belong to THIS component's domain
     * - CREATE/UPDATE names are validated against other components (duplicates
     *   fail)
     * - Revises only affect the target component
     * - Empty array is valid if no modifications are needed
     *
     * Naming: snake_case, plural, domain-prefixed.
     */
    revises: AutoBeDatabaseComponentTableRevise[];
  }
}

/** @deprecated Use IAutoBeDatabaseComponentReviewApplication.IWrite instead. */
export type IAutoBeDatabaseComponentReviewApplicationComplete =
  IAutoBeDatabaseComponentReviewApplication.IWrite;
