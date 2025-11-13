import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
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
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles, getPrismaSchemas) or final endpoint review (complete).
     * When preliminary returns empty array, that type is removed from the
     * union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPrismaSchemas;
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
