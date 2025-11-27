import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

/**
 * Function calling interface for generating DTO transformer functions.
 *
 * Guides the AI agent through creating reusable transformer modules that
 * convert Prisma database query results to API response DTOs (DB → API). Each
 * transformer includes type-safe conversion logic and Prisma select
 * specifications for efficient data loading.
 *
 * The generation follows a structured RAG workflow: preliminary context
 * gathering (Prisma schemas, DTO schemas) → implementation planning → code
 * generation → review and refinement.
 *
 * **Special Case - Rejection**: Not all DTO types require transformers. Some
 * DTOs represent request parameters or business logic types without direct
 * Prisma mappings (e.g., IPage.IRequest, IAuthorizationToken). The agent can
 * reject transformer generation for such incompatible types.
 */
export interface IAutoBeRealizeTransformerWriteApplication {
  /**
   * Process transformer generation task or preliminary data requests.
   *
   * Generates complete transformer module through three-phase workflow (plan →
   * draft → revise). Ensures type safety, proper Prisma payload types, and
   * correct DTO mapping.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeRealizeTransformerWriteApplication.IProps): void;
}

export namespace IAutoBeRealizeTransformerWriteApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests:
     *
     * - What schemas (Prisma or DTO) are missing that you need?
     * - Why do you need them for transformer generation?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion:
     *
     * - What schemas did you acquire?
     * - What transformer patterns did you implement?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every field mapping.
     *
     * For rejection:
     *
     * - What type of DTO is this (request param, business logic, etc.)?
     * - Why doesn't it map to a Prisma table?
     * - Be specific about incompatibility.
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
     * - "getPrismaSchemas": Retrieve Prisma table schemas for DB structure
     * - "getInterfaceSchemas": Retrieve DTO type definitions for API contracts
     * - "complete": Generate final transformer implementation
     * - "reject": Reject transformer generation for incompatible DTO types
     *
     * The preliminary types are removed from the union after their respective
     * data has been provided, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IReject
      | IAutoBePreliminaryGetPrismaSchemas
      | IAutoBePreliminaryGetInterfaceSchemas;
  }

  /**
   * Request to generate transformer module implementation.
   *
   * Executes three-phase generation to create complete transformer with:
   *
   * - Transform() function: Converts Prisma payload to DTO
   * - Select() function: Returns Prisma include/select specification
   *
   * Follows plan → draft → revise pattern to ensure type safety and correct
   * field mappings.
   *
   * Note: The Prisma schema name is provided as input from the planning phase,
   * so it doesn't need to be returned in the response.
   */
  export interface IComplete {
    /** Type discriminator for completion request. */
    type: "complete";

    /**
     * Transformer implementation plan and strategy.
     *
     * Analyzes the Prisma schema and DTO type to plan the transformation logic:
     *
     * - Identifies field mappings (Prisma column → DTO property)
     * - Plans nested object transformations
     * - Determines required Prisma includes/selects
     * - Outlines type casting and validation needs
     */
    plan: string;

    /**
     * Initial transformer implementation draft.
     *
     * The first complete implementation including:
     *
     * - Namespace declaration
     * - Transform() function with proper types
     * - Select() function returning Prisma specification
     * - Nested transformer calls if needed
     */
    draft: string;

    /**
     * Revision and finalization phase.
     *
     * Reviews the draft implementation and produces the final code with all
     * improvements and corrections applied.
     */
    revise: IReviseProps;
  }

  export interface IReviseProps {
    /**
     * Review and improvement suggestions.
     *
     * Identifies areas for improvement in the draft code:
     *
     * - Type safety (proper Prisma payload types)
     * - Field mapping accuracy
     * - Null/undefined handling
     * - Nested transformation correctness
     * - Select specification completeness
     */
    review: string;

    /**
     * Final transformer code.
     *
     * The complete, production-ready transformer module with all review
     * suggestions applied.
     *
     * Returns `null` if the draft is already perfect and needs no changes.
     */
    final: string | null;
  }

  /**
   * Request to reject transformer generation for incompatible DTO types.
   *
   * Not all DTO types require or support transformer generation. Some DTOs
   * represent concepts that don't map directly to Prisma database tables,
   * making transformer generation inappropriate or impossible.
   *
   * Use this when the target DTO falls into one of these categories:
   *
   * 1. **Request Parameter Types**: DTOs used for API input parameters rather
   *    than response data (e.g., `IPage.IRequest`, `ISort`, `IFilter`)
   *
   * 2. **Business Logic Types**: DTOs constructed from business logic rather
   *    than direct database queries (e.g., `IAuthorizationToken`,
   *    `IStatistics`, `IDashboardSummary`)
   *
   * 3. **Computed/Aggregated Types**: DTOs that aggregate data from multiple
   *    tables or require complex business logic (e.g., `IReportSummary`,
   *    `IAnalytics`)
   *
   * The agent should analyze the DTO structure and determine if it maps to a
   * Prisma table. If no clear mapping exists, reject with a detailed
   * explanation.
   */
  export interface IReject {
    /**
     * Type discriminator for rejection request.
     */
    type: "reject";

    /**
     * Detailed explanation of why transformer generation is rejected.
     *
     * Should clearly explain:
     * - What category the DTO falls into (request param, business logic, etc.)
     * - Why it doesn't map to a Prisma table
     * - What the DTO represents instead
     *
     * Example: "IPage.IRequest is a pagination parameter DTO used for API
     * input. It contains query parameters like page number and limit, not data
     * from database tables. No Prisma mapping exists."
     */
    reason: string;
  }
}
