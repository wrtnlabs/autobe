import { IAutoBeRealizeTestResult } from "../compiler/IAutoBeRealizeTestResult";
import { IAutoBeRealizeTestConfig } from "./IAutoBeRealizeTestConfig";

/**
 * Interface representing the Worker RPC service for executing comprehensive E2E
 * test validation against fully implemented backend applications.
 *
 * This interface defines the remote procedure call functions that can be
 * invoked on dedicated worker processes to execute complete E2E test suites
 * against generated backend implementations. The service enables comprehensive
 * validation of backend application quality and production readiness through
 * automated test execution workflows in isolated worker environments.
 *
 * In TGrid's RPC paradigm, this service acts as the Provider that worker
 * processes expose for test execution operations. The main process obtains a
 * `Driver<IAutoBeRealizeTestService>` instance to delegate intensive test
 * execution tasks to worker processes, ensuring optimal performance and
 * resource isolation while maintaining system responsiveness during
 * comprehensive test validation workflows.
 *
 * The service orchestrates the complete test execution pipeline including
 * environment setup, database initialization, concurrent test function
 * execution, and comprehensive result collection to provide definitive
 * assessment of backend implementation quality and production deployment
 * readiness within dedicated worker process boundaries.
 *
 * @author Samchon
 */
export interface IAutoBeRealizeTestService {
  /**
   * Executes comprehensive E2E test suite against the fully implemented backend
   * application to validate production readiness.
   *
   * Performs complete test execution pipeline from environment setup through
   * test suite execution to result compilation, validating that the generated
   * backend implementation correctly fulfills all business requirements, API
   * contracts, and database integration specifications under realistic
   * operational conditions.
   *
   * The execution process encompasses:
   *
   * **Environment Preparation**:
   *
   * - Configuration of test environment with pre-loaded implementation files and
   *   database schemas from the worker context
   * - Optional database reset for clean testing conditions that eliminate
   *   interference from residual data
   * - Package dependency resolution and testing infrastructure setup
   * - Validation of all necessary resources for comprehensive test execution
   *
   * **Test Suite Execution**:
   *
   * - Systematic execution of Test agent-generated E2E test functions with
   *   controlled concurrency for optimal performance
   * - Real-time monitoring of individual test operations with detailed progress
   *   tracking and result collection
   * - Comprehensive error handling and result aggregation for both successful
   *   validations and failure scenarios
   * - Integration testing of API endpoints, business logic, and database
   *   operations under realistic load conditions
   *
   * **Quality Assessment**:
   *
   * - Validation of API contract compliance and response schema correctness
   * - Business logic verification through comprehensive scenario coverage
   * - Database integration testing with proper transaction handling
   * - Error condition testing to ensure robust error handling and recovery
   * - Performance validation under controlled concurrent request scenarios
   *
   * **Result Compilation**:
   *
   * - Detailed collection of individual test operation outcomes with timing and
   *   performance data
   * - Comprehensive analysis of success rates, failure patterns, and
   *   implementation quality metrics
   * - Production readiness assessment based on comprehensive validation results
   * - Detailed diagnostic information for any identified issues or failures
   *
   * The test execution provides the definitive assessment of whether the
   * generated backend application meets all specified requirements and is ready
   * for production deployment without manual debugging or modification. The
   * worker-based execution ensures optimal system performance by isolating
   * intensive test operations from the main process while maintaining
   * comprehensive validation accuracy.
   *
   * @param config Basic test execution configuration including database reset
   *   and concurrency control settings. The worker process is expected to have
   *   access to pre-loaded implementation files, database schemas, and package
   *   configuration through its initialization context, requiring only
   *   execution parameters for the test suite run.
   * @returns Promise resolving to comprehensive test execution results
   *   including configuration details, individual operation outcomes, timing
   *   information, success/failure analysis, and definitive production
   *   readiness assessment from the isolated worker execution context
   */
  execute(config: IAutoBeRealizeTestConfig): Promise<IAutoBeRealizeTestResult>;
}
