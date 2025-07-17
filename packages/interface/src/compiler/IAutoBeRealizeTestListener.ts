import { IAutoBeRealizeTestOperation } from "../compiler/IAutoBeRealizeTestOperation";

/**
 * Interface for Worker RPC event listener provided by client processes to
 * receive real-time E2E test execution events from worker processes.
 *
 * This interface defines the event handling contract for client processes that
 * delegate E2E test execution to dedicated worker processes. Client processes
 * provide an implementation of this interface to receive real-time
 * notifications about test operation progress, individual test completion
 * events, and database reset activities throughout the comprehensive test
 * execution pipeline.
 *
 * In TGrid's RPC paradigm, this listener acts as the Acceptor that client
 * processes expose to worker processes, enabling bidirectional communication
 * where workers can notify clients about test execution progress while
 * maintaining process isolation. The listener functions enable client processes
 * to provide interactive user experiences, display progress indicators, and
 * respond to the dynamic nature of test execution workflows.
 *
 * The listener interface focuses on critical test execution events that require
 * immediate client notification, ensuring optimal performance by transmitting
 * only essential progress information from worker to client processes without
 * overwhelming the communication channel.
 *
 * @author Samchon
 */
export interface IAutoBeRealizeTestListener {
  /**
   * Handles individual E2E test operation completion events from worker
   * processes.
   *
   * Called when each individual E2E test function completes execution in the
   * worker process, providing comprehensive details about the test operation
   * outcome including execution results, timing information, error conditions,
   * and progress tracking data. This enables client processes to display
   * real-time test execution progress and provide immediate feedback about test
   * validation outcomes.
   *
   * The operation events provide granular visibility into the test execution
   * pipeline, allowing client processes to:
   *
   * - Display individual test completion status and results
   * - Track overall test suite execution progress with completion counters
   * - Show specific test function names and execution locations for context
   * - Present detailed error information when test failures occur
   * - Calculate and display test execution performance metrics and timing data
   * - Provide real-time feedback about backend implementation quality assessment
   *
   * This event stream enables responsive user interfaces that keep stakeholders
   * informed about comprehensive validation progress while the actual test
   * execution occurs in isolated worker processes for optimal system
   * performance.
   *
   * @param event Complete test operation result containing execution details,
   *   timing information, success/failure status, return values, error
   *   conditions, and progress tracking data from the individual test function
   *   execution in the worker process
   * @returns Promise that resolves when the client process has completed
   *   handling the test operation event, enabling proper flow control and
   *   ensuring client readiness for subsequent operation notifications
   */
  onOperation(event: IAutoBeRealizeTestOperation): Promise<void>;

  /**
   * Handles database reset completion events from worker processes.
   *
   * Called when the worker process completes database reset operations before
   * test execution begins, indicating that the test environment has been
   * prepared with clean initial conditions. This event enables client processes
   * to display test preparation status and confirm that subsequent test
   * operations will execute under controlled, predictable database states.
   *
   * The reset event provides important timing information for client processes
   * to:
   *
   * - Display test preparation progress and database initialization status
   * - Confirm that clean testing conditions have been established
   * - Indicate the transition from setup phase to actual test execution
   * - Track the overall test execution timeline including preparation overhead
   * - Provide user feedback about test environment readiness and validation scope
   *
   * Database reset represents a critical preparation step that ensures test
   * isolation and reproducibility by eliminating interference from residual
   * data, making this event essential for client understanding of test
   * execution reliability and deterministic result conditions.
   *
   * @returns Promise that resolves when the client process has completed
   *   handling the database reset notification, ensuring proper synchronization
   *   between worker database preparation activities and client progress
   *   display updates
   */
  onReset(): Promise<void>;
}
