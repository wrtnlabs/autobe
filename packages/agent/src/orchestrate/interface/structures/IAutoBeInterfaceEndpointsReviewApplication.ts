import { AutoBeOpenApi } from "@autobe/interface";

/**
 * Interface for reviewing and refining API endpoints through holistic analysis.
 * 
 * This application performs comprehensive review of all endpoints generated
 * through divide-and-conquer strategy, ensuring consistency, eliminating
 * redundancy, and preventing over-engineering across the entire API surface.
 */
export interface IAutoBeInterfaceEndpointsReviewApplication {
  /**
   * Reviews and refines the complete collection of API endpoints.
   * 
   * This method consolidates all endpoints generated independently by different
   * groups and performs holistic review to:
   * - Ensure naming consistency across all endpoints
   * - Remove duplicate or overlapping endpoints
   * - Eliminate over-engineered solutions
   * - Standardize path structures and HTTP methods
   * - Verify REST API design principles
   * 
   * The review process examines the entire API as a cohesive system rather
   * than individual endpoints, ensuring the final API is intuitive, maintainable,
   * and follows best practices.
   * 
   * @param next - The review results and refined endpoint collection
   */
  reviewEndpoints(
    next: IAutoBeInterfaceEndpointsReviewApplication.IProps,
  ): void;
}

export namespace IAutoBeInterfaceEndpointsReviewApplication {
  export interface IProps {
    /**
     * Comprehensive review analysis of all collected endpoints.
     * 
     * Contains detailed findings from the holistic review including:
     * - Identified inconsistencies in naming conventions
     * - Duplicate endpoints that serve the same purpose
     * - Over-engineered solutions that add unnecessary complexity
     * - Violations of REST API design principles
     * - Recommendations for improvement and standardization
     * 
     * The review provides actionable feedback for creating a clean,
     * consistent, and maintainable API structure.
     */
    review: string;

    /**
     * Refined collection of API endpoints after review and cleanup.
     * 
     * The final optimized set of endpoints after:
     * - Removing duplicates and redundant endpoints
     * - Standardizing naming conventions across all paths
     * - Simplifying over-engineered solutions
     * - Ensuring consistent REST patterns
     * - Aligning HTTP methods with their semantic meanings
     * 
     * This collection represents the production-ready API structure
     * that balances functionality with simplicity and maintainability.
     */
    endpoints: AutoBeOpenApi.IEndpoint[];
  }
}
