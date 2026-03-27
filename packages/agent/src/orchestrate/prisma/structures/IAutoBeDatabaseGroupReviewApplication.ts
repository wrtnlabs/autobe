import { AutoBeDatabaseGroupRevise } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseGroupReviewApplication {
  /** Process group review task or retrieve preliminary data. */
  process(props: IAutoBeDatabaseGroupReviewApplication.IProps): void;
}

export namespace IAutoBeDatabaseGroupReviewApplication {
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

  /** Submit group revisions after domain coverage analysis. */
  export interface IComplete {
    /** Type discriminator. Value "complete" indicates final submission. */
    type: "complete";

    /**
     * How business requirements map to proposed group modifications,
     * identifying coverage gaps.
     */
    review: string;

    /**
     * Group revision operations (create/update/erase). Each must include a
     * reason.
     *
     * Constraints:
     *
     * - After revisions: exactly 1 authorization group, at least 1 domain group
     * - Empty array is valid if no modifications are needed
     *
     * Naming: namespace PascalCase, filename `schema-{number}-{domain}.prisma`,
     * kind "authorization" or "domain".
     */
    revises: AutoBeDatabaseGroupRevise[];
  }
}
