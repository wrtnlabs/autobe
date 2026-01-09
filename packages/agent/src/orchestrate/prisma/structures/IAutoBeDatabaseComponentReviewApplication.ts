import { AutoBeDatabaseComponentTableRevise } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseComponentReviewApplication {
  /**
   * Analyze requirements and review the component's table list.
   *
   * Your PRIMARY task is to deeply analyze user requirements and ensure
   * complete table coverage for all features in this component's domain.
   * Review existing tables and identify necessary modifications using
   * create, update, or erase operations.
   *
   * ALWAYS fetch analysis files first using `getAnalysisFiles` to understand
   * what features this component's domain needs to support, then systematically
   * verify table coverage and apply corrections.
   *
   * @param props Request containing either preliminary data request or complete
   *   task with table revisions
   */
  process(props: IAutoBeDatabaseComponentReviewApplication.IProps): void;
}

export namespace IAutoBeDatabaseComponentReviewApplication {
  export interface IProps {
    /**
     * Reflect on requirements analysis before acting.
     *
     * For preliminary requests (getAnalysisFiles, getPreviousAnalysisFiles,
     * getPreviousDatabaseSchemas):
     *
     * - What requirements documents do you need to analyze this component?
     * - Which features in this domain need to be understood?
     *
     * For completion (complete):
     *
     * - What requirements did you analyze?
     * - How many revisions are you making and why?
     * - Summarize the requirements-to-revisions mapping.
     */
    thinking: string;

    /**
     * Request type discriminator.
     *
     * Use preliminary requests (getAnalysisFiles, etc.) to fetch requirements
     * documents. Use complete to submit table revisions after thorough
     * requirements analysis.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Submit table revisions after requirements analysis.
   *
   * Call this after you have:
   * 1. Fetched and analyzed requirements documents
   * 2. Identified missing tables, naming issues, or misplaced tables
   * 3. Prepared create/update/erase operations with clear reasons
   */
  export interface IComplete {
    /**
     * Type discriminator. Value "complete" indicates final submission.
     */
    type: "complete";

    /**
     * Requirements coverage analysis.
     *
     * Document how you analyzed requirements and mapped them to table
     * modifications:
     *
     * - What features does this domain support?
     * - What data storage needs does each feature have?
     * - What tables are missing to fulfill these requirements?
     * - What existing tables need renaming or removal?
     *
     * Be specific - reference actual requirements and explain the
     * requirements-to-revisions mapping.
     */
    review: string;

    /**
     * Array of table revision operations.
     *
     * Include all create, update, and erase operations identified during
     * review. Each operation must include a reason explaining why the
     * change is necessary.
     *
     * ## Operation Types:
     *
     * ### Create - Add missing tables
     * Use when a table is needed to fulfill requirements but doesn't exist.
     * ```typescript
     * {
     *   type: "create",
     *   reason: "Requirement 3.2 specifies order cancellation tracking",
     *   table: "order_cancellations",
     *   description: "Stores cancellation records with reasons and timestamps"
     * }
     * ```
     *
     * ### Update - Rename tables
     * Use when a table has naming convention issues.
     * ```typescript
     * {
     *   type: "update",
     *   reason: "Table name violates snake_case convention",
     *   original: "orderCancel",
     *   updated: "order_cancellations",
     *   description: "Stores cancellation records with reasons and timestamps"
     * }
     * ```
     *
     * ### Erase - Remove tables
     * Use when a table belongs to another domain or is unnecessary.
     * ```typescript
     * {
     *   type: "erase",
     *   reason: "Table belongs to Actors component, not Orders",
     *   table: "shopping_customers"
     * }
     * ```
     *
     * ## Constraints:
     *
     * - Only CREATE tables that CLEARLY belong to THIS component's domain
     * - If uncertain about domain ownership → DO NOT CREATE
     * - Each operation must have a clear, requirement-based reason
     * - Empty array is valid if no modifications are needed
     *
     * ## Naming Conventions:
     *
     * - Snake case: `user_profiles` not `userProfiles`
     * - Plural form: `users` not `user`
     * - Domain prefix: `shopping_customers`
     */
    revises: AutoBeDatabaseComponentTableRevise[];
  }
}
