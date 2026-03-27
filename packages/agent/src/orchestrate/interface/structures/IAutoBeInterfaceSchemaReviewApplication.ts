import {
  AutoBeInterfaceSchemaPropertyExclude,
  AutoBeInterfaceSchemaPropertyRevise,
} from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";

export interface IAutoBeInterfaceSchemaReviewApplication {
  /** Process task or retrieve preliminary data. */
  process(props: IAutoBeInterfaceSchemaReviewApplication.IProps): void;
}
export namespace IAutoBeInterfaceSchemaReviewApplication {
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
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations
      | IAutoBePreliminaryGetPreviousInterfaceSchemas;
  }

  /** Complete schema review with property-level revisions. */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /** Summary of issues found and fixes applied. */
    review: string;

    /**
     * Database properties explicitly excluded from this DTO.
     *
     * Declare every database property that intentionally does not appear in
     * this DTO. Together with `revises`, this must cover every database
     * property — each one must appear in exactly one of the two arrays.
     */
    excludes: AutoBeInterfaceSchemaPropertyExclude[];

    /**
     * Property-level revisions to apply to DTO properties.
     *
     * Every DTO property must appear exactly once with one of: `keep`,
     * `update`, `depict`, `nullish`, `create`, or `erase`. Use `keep` for
     * properties that need no changes.
     *
     * Database properties are addressed either here (via
     * `databaseSchemaProperty`) or in `excludes`. No property can be omitted.
     */
    revises: AutoBeInterfaceSchemaPropertyRevise[];
  }
}
