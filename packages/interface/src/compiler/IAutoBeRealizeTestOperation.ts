import { tags } from "typia";

/**
 * Detailed result interface representing the execution outcome of an individual
 * E2E test function during comprehensive backend implementation validation.
 *
 * This interface captures comprehensive information about a single test
 * operation execution, including identification details, execution results,
 * error conditions, and precise timing data. Each operation represents the
 * validation of a specific API endpoint or business scenario through Test
 * agent-generated E2E test functions executed against the fully implemented
 * backend application.
 *
 * The operation result provides granular visibility into test execution
 * outcomes, enabling detailed analysis of implementation quality, business
 * logic compliance, and performance characteristics at the individual test
 * level. This detailed tracking supports comprehensive validation reporting and
 * precise identification of implementation issues when they occur.
 *
 * @author Samchon
 */
export interface IAutoBeRealizeTestOperation {
  /**
   * Unique identifier name of the executed E2E test function.
   *
   * Specifies the function name that was executed during this test operation,
   * typically corresponding to the Test agent-generated test function
   * identifier. This name provides direct traceability between test results and
   * the specific business scenarios, API endpoints, or validation logic being
   * tested.
   *
   * The test function name serves as the primary identifier for correlating
   * execution results with the original test scenarios, enabling stakeholders
   * to understand which specific functionality was validated and whether the
   * implementation correctly fulfills the intended business requirements and
   * API contracts.
   */
  name: string;

  /**
   * File system path location of the executed test function source code.
   *
   * Specifies the relative or absolute path to the test file that contains the
   * executed function within the project structure. This location information
   * enables direct navigation to the test source code for detailed analysis,
   * debugging, result interpretation, or modification purposes.
   *
   * The file location provides essential context for understanding test
   * organization, enables developers to quickly locate and examine the specific
   * test implementation, and supports comprehensive test suite maintenance and
   * documentation activities.
   */
  location: string;

  /**
   * Return value or result data produced by the test function execution.
   *
   * Contains the actual value returned by the test function upon completion,
   * regardless of whether execution succeeded or failed. This could include API
   * response objects, validation results, test data, computed values, or any
   * other output that the test function produces as part of its business logic
   * validation or endpoint testing.
   *
   * For successful test executions, this value represents the expected result
   * that demonstrates correct implementation behavior. The return value
   * provides insight into the test execution flow and can be analyzed to verify
   * that API responses match expected formats, business logic produces correct
   * outcomes, and data transformations operate as intended.
   */
  value: unknown;

  /**
   * Error information captured during test function execution, if any occurred.
   *
   * Contains detailed error information when the test function encounters
   * exceptions, assertion failures, timeout conditions, or other error states
   * during execution. When null, it indicates that the test completed
   * successfully without encountering any error conditions. When present, the
   * error provides comprehensive diagnostic information for understanding
   * implementation issues or test failures.
   *
   * Error information is crucial for identifying implementation defects, API
   * contract violations, business logic errors, integration failures, or
   * performance issues that prevent the backend application from meeting its
   * requirements. The error details enable developers to pinpoint specific
   * problems and implement necessary corrections to achieve full compliance
   * with validation scenarios.
   */
  error: null | unknown;

  /**
   * Precise timestamp when this specific test operation began execution.
   *
   * Records the exact moment when this individual test function started
   * execution, providing the reference point for measuring test duration and
   * understanding the temporal sequence of test operations within the overall
   * validation process. This timestamp enables detailed performance analysis
   * and execution timeline reconstruction.
   *
   * The start timestamp is essential for identifying execution patterns,
   * analyzing test concurrency behavior, measuring individual test performance,
   * and understanding the temporal distribution of test execution within the
   * comprehensive validation suite.
   */
  started_at: string & tags.Format<"date-time">;

  /**
   * Precise timestamp when this specific test operation finished execution.
   *
   * Records the exact moment when this individual test function completed
   * execution, regardless of whether it succeeded or failed. Combined with the
   * start timestamp, this enables precise calculation of test execution
   * duration and provides completion reference for the overall test timeline.
   *
   * The completion timestamp is valuable for performance analysis of individual
   * test operations, identifying slow-performing test scenarios, understanding
   * test execution efficiency, and maintaining comprehensive audit trails of
   * the validation process. It supports optimization efforts and helps identify
   * potential bottlenecks in either the test implementation or the backend
   * application being validated.
   */
  completed_at: string & tags.Format<"date-time">;
}
