import { AutoBeDatabaseComponentTableRevise } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseAuthorizationReviewApplication {
  /**
   * Analyze requirements and review the single authorization component
   * containing tables for ALL actors.
   *
   * Your PRIMARY task is to deeply analyze authentication requirements and
   * ensure complete table coverage for EVERY actor type in the authorization
   * component. The component contains tables for all actors
   * (guest/member/admin), and you must verify that each actor has its required
   * tables.
   *
   * ALWAYS fetch analysis files first using `getAnalysisSections` to understand
   * what authentication features are required, then systematically verify that
   * EVERY actor has main actor table + session table, and apply corrections.
   *
   * @param props Request containing either preliminary data request or complete
   *   task with table revisions for all actors
   */
  process(props: IAutoBeDatabaseAuthorizationReviewApplication.IProps): void;
}

export namespace IAutoBeDatabaseAuthorizationReviewApplication {
  export interface IProps {
    /**
     * Reflect on requirements analysis before acting.
     *
     * For preliminary requests (getAnalysisSections,
     * getPreviousAnalysisSections, getPreviousDatabaseSchemas):
     *
     * - What authentication requirements do you need to analyze?
     * - Which actor types need to be verified?
     *
     * For completion (complete):
     *
     * - What authentication requirements did you analyze?
     * - How many revisions are you making and why?
     * - Summarize the requirements-to-revisions mapping.
     */
    thinking: string;

    /**
     * Request type discriminator.
     *
     * Use preliminary requests (getAnalysisSections, etc.) to fetch
     * requirements documents. Use complete to submit table revisions after
     * thorough authentication requirements analysis.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Submit table revisions after authentication requirements analysis.
   *
   * Call this after you have:
   *
   * 1. Fetched and analyzed authentication requirements documents
   * 2. Verified EVERY actor has main actor and session tables
   * 3. Prepared create/update/erase operations with clear reasons
   *
   * The authorization component contains tables for ALL actors, so ensure no
   * actor is missing its required tables.
   */
  export interface IComplete {
    /** Type discriminator. Value "complete" indicates final submission. */
    type: "complete";

    /**
     * Authentication requirements coverage analysis.
     *
     * Document how you analyzed authentication requirements and mapped them to
     * table modifications:
     *
     * - What actor types are defined?
     * - Does each actor have a main table and session table?
     * - What authentication support tables are needed?
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
     * review. Each operation must include a reason explaining why the change is
     * necessary.
     *
     * ## Operation Types:
     *
     * ### Create - Add missing tables
     *
     * Use when a table is needed to fulfill authentication requirements but
     * doesn't exist.
     *
     * ```typescript
     * {
     *   "type": "create",
     *   "reason": "Actor 'customer' requires password reset token storage",
     *   "table": "shopping_customer_password_resets",
     *   "description": "Stores password reset tokens with expiration for customers"
     * }
     * ```
     *
     * ### Update - Rename tables
     *
     * Use when a table has naming convention issues.
     *
     * ```typescript
     * {
     *   "type": "update",
     *   "reason": "Table name violates actor naming convention",
     *   "original": "customerSessions",
     *   "updated": "shopping_customer_sessions",
     *   "description": "Authentication sessions for shopping customers"
     * }
     * ```
     *
     * ### Erase - Remove tables
     *
     * Use when a table doesn't belong to authorization.
     *
     * ```typescript
     * {
     *   "type": "erase",
     *   "reason": "Table is a business domain entity, not authentication",
     *   "table": "shopping_orders"
     * }
     * ```
     *
     * ## Constraints:
     *
     * - Only CREATE tables related to authentication and authorization
     * - Each actor MUST have a main actor table and session table
     * - Each operation must have a clear, requirement-based reason
     * - Empty array is valid if no modifications are needed
     *
     * ## Naming Conventions:
     *
     * - Snake case: `user_sessions` not `userSessions`
     * - Plural form: `users` not `user`
     * - Domain prefix: `shopping_customer_sessions`
     * - Actor name in table: all tables must contain the actor name
     */
    revises: AutoBeDatabaseComponentTableRevise[];
  }
}
