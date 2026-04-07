import {
  AutoBeInterfaceSchemaPropertyExclude,
  AutoBeInterfaceSchemaPropertyRevise,
} from "@autobe/interface";

import { IAutoBePreliminaryComplete } from "../../common/structures/IAutoBePreliminaryComplete";
import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";

export interface IAutoBeInterfaceSchemaReviewApplication {
  /**
   * Process schema review via write-validate-correct loop with preliminary data
   * requests.
   *
   * Reviews and validates OpenAPI schema definitions to ensure quality,
   * correctness, and compliance with domain requirements and system policies.
   *
   * @param props Request containing preliminary data request, write submission,
   *   or completion signal
   */
  process(props: IAutoBeInterfaceSchemaReviewApplication.IProps): void;
}
export namespace IAutoBeInterfaceSchemaReviewApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data, submitting a review, or completing
     * your task, reflect on your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisSections, getDatabaseSchemas, etc.):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For write submissions:
     *
     * - What issues did you find in the schema?
     * - What property changes are you proposing?
     * - If this is a revision, what issues are you improving?
     *
     * For completion:
     *
     * - State why you consider the last write final.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform:
     *
     * - Preliminary types: Load context data incrementally
     * - `write`: Submit schema review
     * - `complete`: Finalize when satisfied with last write
     *
     * When preliminary returns empty array, that type is removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IWrite
      | IAutoBePreliminaryComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations
      | IAutoBePreliminaryGetPreviousInterfaceSchemas;
  }

  /**
   * Submit schema review with property-level revisions.
   *
   * After submitting, review your own output. Call `complete` if satisfied, or
   * submit another `write` to improve (3 writes maximum).
   */
  export interface IWrite {
    /** Type discriminator for write submission. */
    type: "write";

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
