import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

/**
 * Function calling interface for generating DTO collector functions.
 *
 * Guides the AI agent through creating reusable collector modules that prepare
 * Prisma input data from API request DTOs (API → DB). Each collector handles
 * complex nested relationships, UUID generation, and proper Prisma
 * connect/create syntax.
 *
 * The generation follows a structured RAG workflow: preliminary context
 * gathering (Prisma schemas, DTO schemas) → implementation planning → code
 * generation → review and refinement.
 */
export interface IAutoBeRealizeCollectorWriteApplication {
  /**
   * Process collector generation task or preliminary data requests.
   *
   * Generates complete collector module through three-phase workflow (plan →
   * draft → revise). Ensures type safety, proper Prisma input types, and
   * correct relationship handling.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeRealizeCollectorWriteApplication.IProps): void;
}

export namespace IAutoBeRealizeCollectorWriteApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests:
     * - What schemas (Prisma or DTO) are missing that you need?
     * - Why do you need them for collector generation?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion:
     * - What schemas did you acquire?
     * - What collector patterns did you implement?
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
     * - "complete": Generate final collector implementation
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
   * Request to generate collector module implementation.
   *
   * Executes three-phase generation to create complete collector with:
   * - collect() function: Converts DTO to Prisma input
   * - Proper handling of nested relationships
   * - UUID generation for new records
   * - Type-safe Prisma create/connect syntax
   *
   * Follows plan → draft → revise pattern to ensure type safety and correct
   * relationship handling.
   */
  export interface IComplete {
    /**
     * Type discriminator for completion request.
     */
    type: "complete";

    /**
     * Collector implementation plan and strategy.
     *
     * Analyzes the DTO type and Prisma schema to plan the collection logic:
     * - Identifies field mappings (DTO property → Prisma input field)
     * - Plans nested relationship handling (create vs connect)
     * - Determines UUID generation points
     * - Outlines validation and transformation needs
     */
    plan: string;

    /**
     * Initial collector implementation draft.
     *
     * The first complete implementation including:
     * - Namespace declaration
     * - collect() function with proper types
     * - Nested collector calls if needed
     * - UUID generation using v4()
     * - Proper Prisma CreateInput types
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
     * - Type safety (proper Prisma input types)
     * - Field mapping accuracy
     * - Relationship handling (create/connect/disconnect)
     * - UUID generation correctness
     * - Null/undefined handling
     * - Nested collection correctness
     */
    review: string;

    /**
     * Final collector code.
     *
     * The complete, production-ready collector module with all review
     * suggestions applied.
     *
     * Returns `null` if the draft is already perfect and needs no changes.
     */
    final: string | null;
  }
}
