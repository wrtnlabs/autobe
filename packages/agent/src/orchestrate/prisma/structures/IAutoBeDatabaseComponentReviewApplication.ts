import { AutoBeDatabaseComponentTableRevise } from "@autobe/interface";

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

  /** Submit table revisions after requirements analysis. */
  export interface IComplete {
    /** Type discriminator. Value "complete" indicates final submission. */
    type: "complete";

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
