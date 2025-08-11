import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired during the review and validation phase of API operation
 * definitions.
 *
 * This event occurs when the Interface agent is reviewing and validating the
 * generated API operations against business requirements, technical
 * specifications, and OpenAPI standards. The review phase ensures that each
 * operation properly implements the required functionality with correct
 * request/response schemas, authentication, error handling, and documentation.
 *
 * The review process involves systematic validation where the agent evaluates
 * operation completeness, parameter correctness, response accuracy, and overall
 * API design consistency. Operations that fail validation are marked for
 * revision to ensure the final API specification meets enterprise-level quality
 * standards.
 *
 * @author Kakasoo
 */
export interface AutoBeInterfaceOperationsReviewEvent
  extends AutoBeEventBase<"interfaceOperationsReview"> {
  /**
   * Current iteration number of the operation review process.
   *
   * Indicates which revision cycle of the API operation review is currently
   * being executed. This step number helps track the iterative validation
   * process and provides context for understanding how many review cycles have
   * been completed to achieve the desired operation quality.
   *
   * The step value increments with each major review iteration, allowing
   * stakeholders to monitor the progressive refinement of API operations and
   * understand the validation rigor applied to the interface design.
   */
  step: number;

  /**
   * Total number of API operations to be reviewed and validated.
   *
   * Represents the complete count of operations that need to undergo the review
   * process. This includes all endpoints across different API paths and HTTP
   * methods that were generated based on the requirements analysis and need
   * validation against business logic and technical specifications.
   */
  total: number;

  /**
   * Number of API operations that have successfully passed review validation.
   *
   * Contains the count of operations that have been reviewed and approved as
   * meeting all quality criteria including correct request/response schemas,
   * proper authentication handling, comprehensive error responses, and complete
   * documentation. These operations are ready for implementation.
   */
  completed: number;
}
