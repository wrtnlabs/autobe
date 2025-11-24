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
     * - What schemas (Prisma or DTO) are missing that you need?
     * - Why do you need them for transformer generation?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion:
     * - What schemas did you acquire?
     * - What transformer patterns did you implement?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every field mapping.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform:
     * - "getPrismaSchemas": Retrieve Prisma table schemas for DB structure
     * - "getInterfaceSchemas": Retrieve DTO type definitions for API contracts
     * - "complete": Generate final transformer implementation
     *
     * The preliminary types are removed from the union after their respective
     * data has been provided, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetPrismaSchemas
      | IAutoBePreliminaryGetInterfaceSchemas;
  }

  /**
   * Request to generate transformer module implementation.
   *
   * Executes three-phase generation to create complete transformer with:
   * - transform() function: Converts Prisma payload to DTO
   * - select() function: Returns Prisma include/select specification
   *
   * Follows plan → draft → revise pattern to ensure type safety and correct
   * field mappings.
   */
  export interface IComplete {
    /**
     * Type discriminator for completion request.
     */
    type: "complete";

    /**
     * Prisma schema name being transformed from.
     *
     * The source Prisma table/model name that provides the data for this
     * transformer. The AI agent determines this by analyzing the Prisma schemas
     * and DTO type definition to find the appropriate database table.
     *
     * Example: "shopping_sale_snapshot_unit_stocks"
     */
    prismaSchemaName: string;

    /**
     * Transformer implementation plan and strategy.
     *
     * Analyzes the Prisma schema and DTO type to plan the transformation logic:
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
     * - Namespace declaration
     * - transform() function with proper types
     * - select() function returning Prisma specification
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
}
