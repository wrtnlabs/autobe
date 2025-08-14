import { IAutoBeRealizeControllerProps } from "./IAutoBeRealizeControllerProps";
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
   * Generates NestJS controller implementations that orchestrate business logic
   * with proper authorization handling.
   *
   * Transforms function specifications and authorization configurations into
   * fully-implemented NestJS controller classes that properly integrate
   * business logic providers, apply authorization decorators, handle request
   * payloads, and manage response structures according to OpenAPI
   * specifications. The generated controllers serve as the entry points for API
   * endpoints, bridging HTTP requests with backend business logic while
   * ensuring proper authentication and authorization enforcement.
   *
   * The controller generation process creates production-ready implementations
   * that include proper import statements for providers and decorators,
   * authorization decorator applications based on role requirements, payload
   * parameter injection for authenticated user contexts, and delegation to
   * provider functions with appropriate parameter passing. This ensures that
   * generated controllers follow NestJS best practices and maintain clean
   * separation between HTTP handling and business logic execution.
   *
   * @param props Configuration including OpenAPI document for endpoint
   *   specifications, function implementations with their provider locations,
   *   and authorization configurations with decorator and payload definitions
   * @returns Promise resolving to generated controller files mapped by their
   *   file paths, ready for integration into the NestJS application structure
   */
  controller(
    props: IAutoBeRealizeControllerProps,
  ): Promise<Record<string, string>>;

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

  getTemplate(): Promise<Record<string, string>>;
}
