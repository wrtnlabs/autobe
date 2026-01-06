import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseComponentReviewApplication {
  /**
   * Analyze requirements and enrich the component's table list.
   *
   * Your PRIMARY task is to deeply analyze user requirements and ensure
   * complete table coverage for all features in this component's domain.
   *
   * ALWAYS fetch analysis files first using `getAnalysisFiles` to understand
   * what features this component's domain needs to support, then systematically
   * verify table coverage.
   *
   * @param props Request containing either preliminary data request or complete
   *   task with enriched table list
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
     * - How many tables are you adding and why?
     * - Summarize the requirements-to-tables mapping.
     */
    thinking: string;

    /**
     * Request type discriminator.
     *
     * Use preliminary requests (getAnalysisFiles, etc.) to fetch requirements
     * documents. Use complete to submit the enriched table list after
     * thorough requirements analysis.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Submit the enriched table list after requirements analysis.
   *
   * Call this after you have:
   * 1. Fetched and analyzed requirements documents
   * 2. Identified missing tables based on feature requirements
   * 3. Verified naming conventions and domain fit
   */
  export interface IComplete {
    /**
     * Type discriminator. Value "complete" indicates final submission.
     */
    type: "complete";

    /**
     * Requirements coverage analysis.
     *
     * Document how you analyzed requirements and mapped them to tables:
     *
     * - What features does this domain support?
     * - What data storage needs does each feature have?
     * - What tables are missing to fulfill these requirements?
     * - What existing tables correctly cover requirements?
     *
     * Be specific - reference actual requirements and explain the
     * requirements-to-tables mapping.
     */
    review: string;

    /**
     * Table changes with requirement-based justification.
     *
     * For each table added, explain which requirement it fulfills:
     *
     * - "Added order_cancellations: Requirement 3.2 - cancellation tracking"
     * - "Added order_refunds: Requirement 3.4 - refund processing"
     *
     * For tables kept, confirm they cover existing requirements.
     * For tables removed, explain why they don't belong to this domain.
     */
    plan: string;

    /**
     * Final enriched table list.
     *
     * Contains the complete list of tables after requirements-driven
     * enrichment. This REPLACES the original table list.
     *
     * CONSTRAINTS:
     *
     * - ADD tables that requirements need but are missing
     * - REMOVE tables that belong to other domains
     * - RENAME tables to fix naming convention issues
     * - CANNOT add tables that exist in OTHER components
     *
     * Naming conventions:
     *
     * - Snake case: `user_profiles` not `userProfiles`
     * - Plural form: `users` not `user`
     * - Domain prefix: `shopping_customers`
     */
    tables: string[];
  }
}
