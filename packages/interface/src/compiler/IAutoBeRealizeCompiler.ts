import { IAutoBeRealizeTestProps } from "./IAutoBeRealizeTestProps";
import { IAutoBeRealizeTestResult } from "./IAutoBeRealizeTestResult";

/**
 * Interface for the Realize compiler that handles comprehensive E2E test
 * execution and backend implementation validation.
 *
 * This compiler provides the final validation layer in the AutoBE development
 * pipeline, orchestrating the execution of Test agent-generated E2E test suites
 * against fully implemented backend applications. The Realize compiler ensures
 * that generated implementations correctly fulfill all business requirements,
 * API contracts, and database integration specifications through comprehensive
 * functional testing under realistic operational conditions.
 *
 * The compiler operates by setting up complete test environments, managing
 * database state for clean testing conditions, executing test suites with
 * controlled concurrency, and providing detailed validation results that
 * determine the production readiness of generated backend applications. This
 * comprehensive validation approach guarantees that AutoBE-generated code works
 * correctly on the first deployment without manual debugging cycles.
 *
 * @author Samchon
 */
export interface IAutoBeRealizeCompiler {
  /**
   * Executes comprehensive E2E test suite validation against the fully
   * implemented backend application.
   *
   * Performs the complete test execution pipeline from environment setup
   * through test suite execution to result compilation. This includes
   * configuring the test environment with generated implementation files and
   * database schemas, optionally performing database reset for clean testing
   * conditions, executing Test agent-generated E2E test functions with
   * controlled concurrency, and collecting comprehensive validation results.
   *
   * The test execution process validates that the Realize agent's
   * implementation correctly integrates with the NestJS framework, maintains
   * type safety with Prisma client APIs, properly implements business logic
   * according to requirements, handles API contracts as specified in OpenAPI
   * documents, and performs correctly under realistic operational conditions
   * including concurrent request scenarios.
   *
   * The execution includes sophisticated error handling and result collection
   * that captures both successful validations and detailed error information
   * for any failures, enabling precise identification of implementation issues
   * and comprehensive assessment of backend application quality and production
   * readiness.
   *
   * @param props Configuration parameters including implementation files,
   *   database schemas, execution settings, and environmental specifications
   *   required for comprehensive test execution
   * @returns Test execution results including configuration details, individual
   *   operation outcomes, timing information, and comprehensive validation
   *   status for production readiness assessment
   */
  test(props: IAutoBeRealizeTestProps): Promise<IAutoBeRealizeTestResult>;
}
