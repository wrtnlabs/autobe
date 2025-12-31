import { AutoBeDatabase } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseComponentApplication {
  /**
   * Process component extraction task or preliminary data requests.
   *
   * Organizes database tables into domain-based components for database schema
   * generation. Processes extraction with incremental context loading to ensure
   * comprehensive domain organization.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeDatabaseComponentApplication.IProps): void;
}

export namespace IAutoBeDatabaseComponentApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getPreviousAnalysisFiles):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     *
     * - What key assets did you acquire?
     * - What did you accomplish?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every single item.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles, getPreviousAnalysisFiles) or final component
     * extraction (complete). When preliminary returns empty array, that type is
     * removed from the union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Request to extract domain components from database tables.
   *
   * Executes component extraction to organize tables into logical domains.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval or actual
     * task execution. Value "complete" indicates this is the final task
     * execution request.
     */
    type: "complete";

    /**
     * Initial thoughts on namespace classification criteria.
     *
     * Contains the AI agent's initial analysis and reasoning about how to
     * organize tables into different business domains/namespaces.
     *
     * **Example:**
     *
     *     "Based on the business requirements, I identify several key domains:
     *     - User-related entities should be grouped under 'Actors' namespace
     *     - Product and sales information under 'Sales' namespace
     *     - System configuration under 'Systematic' namespace"
     */
    thinking: string;

    /**
     * Review and refinement of the namespace classification.
     *
     * Contains the AI agent's review process, considering relationships between
     * tables and potential improvements to the initial classification.
     *
     * **Example:**
     *
     *     "Upon review, I noticed that 'shopping_channel_categories' has strong
     *     relationships with both channels and sales. However, since it primarily
     *     defines the channel structure, it should remain in 'Systematic' namespace."
     */
    review: string;

    /**
     * Final decision on namespace classification.
     *
     * Contains the AI agent's final reasoning and rationale for the chosen
     * namespace organization, explaining why this structure best serves the
     * business requirements.
     *
     * **Example:**
     *
     *     "Final decision: Organize tables into 3 main namespaces:
     *     1. Systematic - for channel and system configuration
     *     2. Actors - for all user types (customers, citizens, administrators)
     *     3. Sales - for product sales and related transactional data
     *     This structure provides clear separation of concerns and follows DDD principles."
     */
    decision: string;

    /**
     * Array of domain components that group related database tables.
     *
     * Each component represents a business domain and becomes one database schema
     * file. Common domains include: Actors (users), Sales (products), Orders,
     * Carts, etc.
     *
     * **Example:**
     *
     * ```typescript
     * {
     *   "components": [
     *     {
     *       "filename": "schema-02-systematic.prisma",
     *       "namespace": "Systematic",
     *       "thinking": "These tables all relate to system configuration and channel management. They form the foundation of the platform.",
     *       "review": "Considering the relationships, shopping_channel_categories connects channels and sales, but it fundamentally defines channel structure.",
     *       "rationale": "Grouping all system configuration tables together provides a clear foundation layer that other domains can reference.",
     *       "tables": [
     *         "shopping_channels",
     *         "shopping_sections",
     *         "shopping_channel_categories"
     *       ]
     *     },
     *     {
     *       "filename": "schema-03-actors.prisma",
     *       "namespace": "Actors",
     *       "thinking": "All user-related entities should be grouped together as they share authentication and identity patterns.",
     *       "review": "While customers interact with sales, the customer entity itself is about identity, not transactions.",
     *       "rationale": "This component groups all actor-related tables to maintain separation between identity management and business transactions.",
     *       "tables": [
     *         "shopping_customers",
     *         "shopping_citizens",
     *         "shopping_administrators"
     *       ]
     *     },
     *     {
     *       "filename": "schema-04-sales.prisma",
     *       "namespace": "Sales",
     *       "thinking": "Product catalog and sales-related tables belong together as they form the core commerce functionality.",
     *       "review": "Sales snapshots are integral to the sales domain for tracking product history and price changes.",
     *       "rationale": "Consolidating all sales-related tables enables coherent management of the entire product lifecycle.",
     *       "tables": [
     *         "shopping_sales",
     *         "shopping_sale_snapshots",
     *         "shopping_sale_units",
     *         "shopping_sale_unit_options"
     *       ]
     *     }
     *   ]
     * }
     * ```
     *
     * **Notes:**
     *
     * - Table names must follow snake_case convention with domain prefix (e.g.,
     *   `shopping_customers`)
     * - Each component becomes one `.prisma` file containing related models
     * - Filename numbering indicates dependency order for schema generation
     * - Namespace is used for documentation organization and domain grouping
     */
    components: AutoBeDatabase.IComponent[] & tags.MinItems<1>;
  }
}
