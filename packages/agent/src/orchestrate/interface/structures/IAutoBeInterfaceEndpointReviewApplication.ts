import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousPrismaSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeInterfaceEndpointReviewApplication {
  /**
   * Process endpoint review task or preliminary data requests.
   *
   * Consolidates all endpoints generated independently and performs holistic
   * review to ensure consistency, remove duplicates, eliminate
   * over-engineering, and verify REST API design principles.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceEndpointReviewApplication.IProps): void;
}

export namespace IAutoBeInterfaceEndpointReviewApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getPrismaSchemas, etc.):
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
     * (getAnalysisFiles, getPreviousAnalysisFiles, getPrismaSchemas,
     * getPreviousPrismaSchemas) or final endpoint review (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPrismaSchemas
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousPrismaSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations;
  }

  /**
   * Request to review and refine API endpoints.
   *
   * Executes comprehensive endpoint review to consolidate independently
   * generated endpoints, ensure consistency, eliminate redundancy, and create a
   * clean, maintainable API structure following REST best practices.
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
     * Comprehensive review analysis of all collected endpoints.
     *
     * Contains detailed findings from the holistic review including:
     *
     * - Identified inconsistencies in naming conventions
     * - Duplicate endpoints that serve the same purpose
     * - Over-engineered solutions that add unnecessary complexity
     * - Violations of REST API design principles
     * - Recommendations for improvement and standardization
     *
     * The review provides actionable feedback for creating a clean, consistent,
     * and maintainable API structure.
     */
    review: string;

    /**
     * Refined collection of API endpoints after review and cleanup.
     *
     * The final optimized set of endpoints after:
     *
     * - Removing duplicates and redundant endpoints
     * - Standardizing naming conventions across all paths
     * - Simplifying over-engineered solutions
     * - Ensuring consistent REST patterns
     * - Aligning HTTP methods with their semantic meanings
     *
     * This collection represents the production-ready API structure that
     * balances functionality with simplicity and maintainability.
     */
    endpoints: AutoBeOpenApi.IEndpoint[];
  }
}
