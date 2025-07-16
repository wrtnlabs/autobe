import { tags } from "typia";

import { IAutoBeRealizeTestOperation } from "./IAutoBeRealizeTestOperation";

/**
 * Comprehensive result interface containing complete information about E2E test
 * suite execution for backend implementation validation.
 *
 * This interface represents the final consolidated results of executing the
 * entire Test agent-generated E2E test suite against the fully implemented
 * backend application. It encapsulates all aspects of the test execution
 * process including configuration parameters, individual operation results, and
 * timing information that collectively determine the validation outcome of the
 * generated backend implementation.
 *
 * The result structure provides stakeholders with comprehensive visibility into
 * the validation process, enabling detailed analysis of backend implementation
 * quality, compliance with requirements, and production readiness assessment
 * based on exhaustive functional testing.
 *
 * @author Samchon
 */
export interface IAutoBeRealizeTestResult {
  /**
   * Whether the test execution included a clean database reset before testing.
   *
   * Indicates if the test suite execution began with a complete database reset
   * to ensure clean testing conditions. When true, all existing data was purged
   * and database tables were reconstructed to their initial state before test
   * execution commenced, guaranteeing test isolation and reproducibility.
   *
   * Database reset is essential for ensuring that test results are
   * deterministic and accurately reflect the application's behavior under
   * controlled conditions, free from interference by residual data from
   * previous executions or development activities. This flag helps stakeholders
   * understand the testing conditions and trust the reliability of results.
   */
  reset: boolean;

  /**
   * Number of test functions that were executed simultaneously during the test
   * suite run.
   *
   * Specifies the concurrent execution limit that was applied during E2E test
   * function execution to optimize testing performance while maintaining system
   * stability. This value represents the balance between test execution speed
   * and resource consumption that was used to validate the backend
   * implementation's ability to handle concurrent requests.
   *
   * The simultaneous execution count provides insight into the load conditions
   * under which the backend application was validated, helping stakeholders
   * understand the concurrency testing coverage and the application's
   * performance characteristics under parallel request scenarios.
   */
  simultaneous: number;

  /**
   * Complete collection of individual test operation results with detailed
   * execution information.
   *
   * Contains the comprehensive array of {@link IAutoBeRealizeTestOperation}
   * results representing every E2E test function that was executed during the
   * validation process. Each operation result includes detailed information
   * about test execution outcomes, return values, error conditions, timing
   * data, and validation status for specific API endpoints or business
   * scenarios.
   *
   * This complete result set enables stakeholders to perform detailed analysis
   * of which functionality passed validation, which tests failed, what specific
   * issues were encountered, and how the backend implementation performs under
   * various test scenarios. The operation results serve as the authoritative
   * record of implementation quality and compliance with established
   * requirements.
   */
  operations: IAutoBeRealizeTestOperation[];

  /**
   * Timestamp when the comprehensive test suite execution was initiated.
   *
   * Records the exact moment when the E2E test suite execution began, marking
   * the start of the final validation phase in the AutoBE development pipeline.
   * This timestamp provides the reference point for understanding the complete
   * test execution timeline and measuring the duration of comprehensive backend
   * validation.
   *
   * The start timestamp is essential for performance analysis of the entire
   * validation process, enabling stakeholders to understand test execution
   * efficiency and identify potential optimization opportunities in the testing
   * infrastructure or backend implementation.
   */
  started_at: string & tags.Format<"date-time">;

  /**
   * Timestamp when the entire test suite execution was finalized.
   *
   * Records the exact moment when all planned E2E test operations finished
   * execution, marking the completion of the comprehensive validation process.
   * This timestamp represents the definitive end point of the AutoBE
   * development pipeline validation phase and provides the completion reference
   * for calculating total validation duration.
   *
   * The completion timestamp serves as the official validation completion
   * marker for stakeholders tracking project delivery milestones and provides
   * essential audit trail information for the complete development and
   * validation cycle. Combined with the start timestamp, it enables precise
   * measurement of the total time required for comprehensive backend
   * validation.
   */
  completed_at: string & tags.Format<"date-time">;
}
