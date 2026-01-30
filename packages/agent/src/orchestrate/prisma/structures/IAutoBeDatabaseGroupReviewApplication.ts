import { AutoBeDatabaseGroupRevise } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseGroupReviewApplication {
  /**
   * Analyze requirements and review the component group skeletons.
   *
   * Your PRIMARY task is to verify that the group structure provides complete,
   * well-organized coverage of all business domains described in the
   * requirements. Review existing groups and identify necessary modifications
   * using create, update, or erase operations.
   *
   * ALWAYS fetch analysis files first using `getAnalysisFiles` to understand
   * what business domains exist, then systematically verify group coverage and
   * apply corrections.
   *
   * @param props Request containing either preliminary data request or complete
   *   task with group revisions
   */
  process(props: IAutoBeDatabaseGroupReviewApplication.IProps): void;
}

export namespace IAutoBeDatabaseGroupReviewApplication {
  export interface IProps {
    /**
     * Reflect on requirements analysis before acting.
     *
     * For preliminary requests (getAnalysisFiles, getPreviousAnalysisFiles,
     * getPreviousDatabaseSchemas):
     *
     * - What business domains do you need to analyze?
     * - What requirements will help verify group coverage?
     *
     * For completion (complete):
     *
     * - What domains did you analyze?
     * - How many revisions are you making and why?
     * - Summarize the domain-to-group mapping.
     */
    thinking: string;

    /**
     * Request type discriminator.
     *
     * Use preliminary requests (getAnalysisFiles, etc.) to fetch requirements
     * documents. Use complete to submit group revisions after thorough domain
     * coverage analysis.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Submit group revisions after domain coverage analysis.
   *
   * Call this after you have:
   *
   * 1. Fetched and analyzed business requirements documents
   * 2. Verified all business domains have corresponding groups
   * 3. Prepared create/update/erase operations with clear reasons
   */
  export interface IComplete {
    /** Type discriminator. Value "complete" indicates final submission. */
    type: "complete";

    /**
     * Domain coverage analysis.
     *
     * Document how you analyzed business requirements and mapped them to group
     * modifications:
     *
     * - What business domains are defined in requirements?
     * - Does each domain have a corresponding group?
     * - Are group boundaries appropriate?
     * - Are kind assignments correct?
     *
     * Be specific - reference actual requirements and explain the
     * domain-to-revisions mapping.
     */
    review: string;

    /**
     * Array of group revision operations.
     *
     * Include all create, update, and erase operations identified during
     * review. Each operation must include a reason explaining why the change is
     * necessary.
     *
     * ## Operation Types:
     *
     * ### Create - Add missing groups
     *
     * Use when a business domain has no corresponding group.
     *
     * ```typescript
     * {
     *   "type": "create",
     *   "reason": "Notification functionality exists in requirements but has no group",
     *   "group": {
     *     "thinking": "...",
     *     "review": "...",
     *     "rationale": "...",
     *     "namespace": "Notifications",
     *     "filename": "schema-10-notifications.prisma",
     *     "kind": "domain"
     *   }
     * }
     * ```
     *
     * ### Update - Modify existing groups
     *
     * Use when a group has property issues.
     *
     * ```typescript
     * {
     *   "type": "update",
     *   "reason": "Namespace uses incorrect casing",
     *   "originalNamespace": "products_catalog",
     *   "group": {
     *     "thinking": "...",
     *     "review": "...",
     *     "rationale": "...",
     *     "namespace": "Products",
     *     "filename": "schema-03-products.prisma",
     *     "kind": "domain"
     *   }
     * }
     * ```
     *
     * ### Erase - Remove groups
     *
     * Use when a group is unnecessary.
     *
     * ```typescript
     * {
     *   "type": "erase",
     *   "reason": "Group is redundant with existing Products group",
     *   "namespace": "Catalog"
     * }
     * ```
     *
     * ## Constraints:
     *
     * - After revisions: exactly 1 authorization group, ≥1 domain groups
     * - Each operation must have a clear, requirement-based reason
     * - Empty array is valid if no modifications are needed
     *
     * ## Naming Conventions:
     *
     * - Namespace: PascalCase (e.g., "Products", "Orders")
     * - Filename: `schema-{number}-{domain}.prisma` format
     * - Kind: "authorization" or "domain"
     */
    revises: AutoBeDatabaseGroupRevise[];
  }
}
