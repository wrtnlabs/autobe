import { AutoBeOpenApi } from "@autobe/interface";

/**
 * Application interface for reviewing and validating API operations.
 *
 * Provides functionality to systematically review generated API operations
 * against business requirements, technical specifications, and OpenAPI
 * standards. The review process ensures each operation meets quality criteria
 * before proceeding to implementation.
 */
export interface IAutoBeInterfaceOperationsReviewApplication {
  /**
   * Reviews a batch of API operations for quality and correctness.
   *
   * Validates each operation's request/response schemas, authentication
   * handling, error responses, and documentation completeness. Operations are
   * marked as passed or failed based on compliance with enterprise standards.
   *
   * @param input Collection of operations to review with their validation
   *   results
   */
  reviewOperations(
    input: IAutoBeInterfaceOperationsReviewApplication.IProps,
  ): void;
}

export namespace IAutoBeInterfaceOperationsReviewApplication {
  /**
   * Properties for API operation review and improvement process.
   *
   * Contains both the input operations to be reviewed and the outputs generated
   * by the Interface Operations Review Agent, which will be published as part
   * of the AutoBeInterfaceOperationsReviewEvent.
   */
  export interface IProps {
    /**
     * Detailed review analysis.
     *
     * Contains the Interface Operations Review Agent's comprehensive assessment
     * including security vulnerability checks, schema compliance validation,
     * logical consistency verification, and standard adherence evaluation.
     * Identifies critical issues that must be fixed and provides
     * recommendations.
     */
    review: string;

    /**
     * Improvement plan.
     *
     * A structured action plan created by the Interface Operations Review Agent
     * outlining specific corrections needed for security issues, logic errors,
     * and schema violations. If operations are perfect, explicitly states that
     * no changes are required.
     */
    plan: string;

    /**
     * Enhanced operations.
     *
     * The final corrected API operations produced by the Interface Operations
     * Review Agent after applying all fixes from the improvement plan. If no
     * issues were found, contains the original operations unchanged. These
     * operations are ready for schema generation and implementation phases.
     */
    content: AutoBeOpenApi.IOperation[];
  }
}
