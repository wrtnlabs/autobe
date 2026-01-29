import { AutoBeDatabaseDeduplicationGroup } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseDeduplicationApplication {
  /**
   * Analyze tables for semantic duplicates across components.
   *
   * Your PRIMARY task is to compare the target component's tables against all
   * other components' tables and identify groups of tables that serve the same
   * purpose, even if they have different names.
   *
   * ALWAYS fetch analysis files first using `getAnalysisFiles` to understand
   * the business context, then systematically compare tables and build
   * duplicate groups.
   *
   * @param props Request containing either preliminary data request or complete
   *   task with duplicate groups
   */
  process(props: IAutoBeDatabaseDeduplicationApplication.IProps): void;
}

export namespace IAutoBeDatabaseDeduplicationApplication {
  export interface IProps {
    /**
     * Reflect on the deduplication analysis before acting.
     *
     * For preliminary requests (getAnalysisFiles, getPreviousAnalysisFiles,
     * getPreviousDatabaseSchemas):
     *
     * - What requirements documents do you need to understand table purposes?
     * - Which business domains need to be understood for comparison?
     *
     * For completion (complete):
     *
     * - How many duplicate groups did you find?
     * - Which tables are duplicated and why?
     * - Summarize the comparison results.
     */
    thinking: string;

    /**
     * Request type discriminator.
     *
     * Use preliminary requests (getAnalysisFiles, etc.) to fetch requirements
     * documents for understanding table purposes. Use complete to submit
     * duplicate group identification results.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Submit duplicate group identification results.
   *
   * Call this after you have:
   *
   * 1. Fetched and analyzed requirements documents
   * 2. Compared each target component table against all other tables
   * 3. Identified groups of semantically equivalent tables
   */
  export interface IComplete {
    /**
     * Type discriminator. Value "complete" indicates final submission.
     */
    type: "complete";

    /**
     * Analysis of the deduplication comparison process.
     *
     * Documents the agent's understanding and comparison approach:
     *
     * - What tables in the target component were analyzed?
     * - What tables in other components were compared against?
     * - What semantic patterns were identified across components?
     * - How were table purposes determined from names and descriptions?
     */
    analysis: string;

    /**
     * Rationale for the duplicate group decisions.
     *
     * Explains why specific tables were grouped as duplicates:
     *
     * - Why are identified groups considered semantically equivalent?
     * - What evidence supports each grouping decision?
     * - Why were certain similar-looking tables NOT grouped?
     * - What distinguishes true duplicates from related but distinct tables?
     */
    rationale: string;

    /**
     * Groups of semantically duplicate tables.
     *
     * Each group contains tables from different components that serve the
     * same purpose. Empty array if no duplicates are found.
     *
     * ## Group Rules:
     *
     * - Each group must have at least 2 tables
     * - Each group must include at least 1 table from the target component
     * - Each table can appear in only one group
     *
     * ## Example:
     *
     * ```typescript
     * [
     *   {
     *     reason: "Both tables store customer authentication data",
     *     tables: [
     *       { namespace: "Authorization", name: "customers" },
     *       { namespace: "Sales", name: "shopping_customers" }
     *     ]
     *   }
     * ]
     * ```
     *
     * ## Judgment Criteria:
     *
     * - Read both name AND description to determine purpose
     * - Same purpose = duplicate (even with different names)
     * - Different purpose = NOT duplicate (even with same name)
     * - Parent-child or snapshot relationships = NOT duplicates
     */
    duplicateGroups: AutoBeDatabaseDeduplicationGroup[];
  }
}
