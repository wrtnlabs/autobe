import { AutoBeDatabaseGroupRevise } from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
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

  /** Submit group revisions for validation. */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

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

/** @deprecated Use IAutoBeDatabaseGroupReviewApplication.IWrite instead. */
export type IAutoBeDatabaseGroupReviewApplicationComplete =
  IAutoBeDatabaseGroupReviewApplication.IWrite;
