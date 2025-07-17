/**
 * Configuration interface defining the essential execution parameters required
 * for comprehensive E2E test suite validation against fully implemented backend
 * applications.
 *
 * This interface encapsulates the core execution settings and control
 * parameters necessary to orchestrate the final validation phase of the AutoBE
 * development pipeline. It provides streamlined configuration options that
 * control test execution behavior, database management, and performance
 * characteristics without requiring direct access to implementation files or
 * database schemas.
 *
 * The configuration assumes that the test execution environment has been
 * pre-configured with all necessary resources including generated
 * implementation files, database schemas, and package dependencies. This
 * interface focuses solely on runtime execution parameters that control how the
 * test suite operates within the prepared environment.
 *
 * This lightweight configuration approach enables flexible test execution
 * across different environments while maintaining clear separation between
 * resource provisioning and execution control, supporting both development and
 * production validation scenarios.
 *
 * @author Samchon
 */
export interface IAutoBeRealizeTestConfig {
  /**
   * Optional flag indicating whether to perform a complete database reset
   * before test execution.
   *
   * When true, specifies that the test execution should begin with a
   * comprehensive database reset, purging all existing data and reconstructing
   * tables to their initial schema-defined state. When false, test execution
   * proceeds with the current database state, which may contain residual data
   * from previous operations.
   *
   * Database reset is crucial for ensuring test isolation, reproducibility, and
   * deterministic results. Clean state testing eliminates interference from
   * residual data and guarantees that each test execution cycle operates under
   * identical baseline conditions, enabling accurate validation of backend
   * implementation behavior.
   *
   * @default true
   */
  reset?: boolean;

  /**
   * Optional specification of the maximum number of test functions to execute
   * concurrently during the test suite run.
   *
   * Defines the concurrent execution limit for E2E test functions to optimize
   * testing performance while maintaining system stability and resource
   * management. This value balances test execution speed with resource
   * consumption and helps prevent system overload during comprehensive
   * validation.
   *
   * Concurrent execution significantly reduces total testing time for large
   * test suites while validating the backend application's ability to handle
   * parallel requests correctly. The simultaneous limit ensures controlled load
   * conditions that provide meaningful performance insights while maintaining
   * test reliability and result accuracy.
   *
   * @default 1
   */
  simultaneous?: number;
}
