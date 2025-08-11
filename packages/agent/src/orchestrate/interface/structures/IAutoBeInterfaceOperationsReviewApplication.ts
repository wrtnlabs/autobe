import { AutoBeOpenApi } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBeInterfaceOperationApplication } from "./IAutoBeInterfaceOperationApplication";

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
   * Input properties for the operation review process.
   *
   * Contains the collection of review results for API operations that have been
   * evaluated against quality standards.
   */
  export interface IProps {
    /**
     * Array of individual operation review results.
     *
     * Each review contains the operation identifier (method and path) along
     * with the validation outcome and any failure reasons.
     */
    reviews: IReview[];
  }

  /**
   * Individual API operation review result.
   *
   * Represents the validation outcome for a single API operation, including
   * whether it passed quality checks and any reasons for failure.
   */
  export interface IReview {
    /**
     * HTTP method of the reviewed operation.
     *
     * Standard HTTP verbs such as GET, POST, PUT, DELETE, PATCH that identify
     * the operation type.
     */
    method: string;

    /**
     * API path of the reviewed operation.
     *
     * The URL path pattern that identifies the endpoint, which may include path
     * parameters (e.g., "/users/{id}").
     */
    path: string;

    /**
     * Validation result indicating if the operation meets quality standards.
     *
     * True if the operation passes all validation checks including schema
     * correctness, proper authentication, comprehensive error handling, and
     * complete documentation. False if any quality criteria are not met.
     */
    passed: boolean;

    /**
     * Detailed explanation of validation failure.
     *
     * Required when passed is false, providing specific reasons why the
     * operation failed validation. Must be at least 10 characters to ensure
     * meaningful feedback. Null when the operation passes validation.
     */
    reason: (string & tags.MinLength<10>) | null;
  }
}

export namespace IAutoBeInterfaceOperationsReview {
  /**
   * Input parameters for the operation review process.
   *
   * Contains the complete context needed to review and validate API operations,
   * including both the endpoint definitions and their detailed specifications.
   */
  export interface IInput {
    /**
     * Complete list of API endpoints to be reviewed.
     *
     * Represents all endpoints in the API specification that need validation,
     * providing the full context for cross-referencing and consistency checks.
     */
    endpoints: AutoBeOpenApi.IEndpoint[];

    /**
     * Detailed operation specifications to review.
     *
     * Contains either partial operation definitions from the generation phase
     * or complete operation specifications that need validation. Each operation
     * includes request/response schemas, parameters, and documentation.
     */
    operations: IAutoBeInterfaceOperationApplication.IOperation[];
  }

  /**
   * Successful operation review result.
   *
   * Represents an API operation that has passed all validation checks and is
   * ready for implementation.
   */
  export interface Success {
    /** Result type identifier for successful validation. */
    type: "success";

    /**
     * The API endpoint that passed validation.
     *
     * Contains the complete operation definition including method, path, and
     * all specification details.
     */
    endpoint: AutoBeOpenApi.IEndpoint;
  }

  /**
   * Failed operation review result.
   *
   * Represents an API operation that did not meet quality standards and
   * requires revision before implementation.
   */
  export interface Failure {
    /** Result type identifier for failed validation. */
    type: "failure";

    /**
     * The API endpoint that failed validation.
     *
     * Contains the complete operation definition that needs revision to meet
     * quality standards.
     */
    endpoint: AutoBeOpenApi.IEndpoint;

    /**
     * Detailed explanation of why the operation failed validation.
     *
     * Provides specific feedback about what aspects of the operation need
     * improvement, such as schema issues, missing parameters, or incomplete
     * documentation.
     */
    reason: string;
  }
}

/**
 * Aggregated results of the operation review process.
 *
 * Contains categorized collections of operations based on their validation
 * outcomes, separating those ready for implementation from those requiring
 * additional work.
 */
export interface IAutoBeInterfaceOperationsReview {
  /**
   * Operations that successfully passed validation.
   *
   * These operations meet all quality criteria and are ready to proceed to the
   * implementation phase without modifications.
   */
  passed: IAutoBeInterfaceOperationsReview.Success[];

  /**
   * Operations that failed validation and require revision.
   *
   * These operations have identified issues that must be addressed before they
   * can be approved for implementation.
   */
  failure: IAutoBeInterfaceOperationsReview.Failure[];
}
