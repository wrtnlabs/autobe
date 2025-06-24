import { IAutoBeTestProgress } from "../test/AutoBeTestProgress";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired during the test generation process as the Test agent creates
 * individual test scenario files.
 *
 * This event provides real-time visibility into the test creation progress as
 * the Test agent systematically writes test scenarios for each API endpoint.
 * Each progress event represents the completion of a specific test file that
 * implements use case scenarios, ensuring comprehensive coverage of API
 * functionality and business logic validation.
 *
 * The progress events enable stakeholders to monitor the test suite development
 * and understand how comprehensive validation coverage is being built to ensure
 * the generated application functions correctly under realistic operational
 * conditions and properly implements business requirements.
 *
 * @author Michael
 */
export interface AutoBeTestProgressEvent
  extends AutoBeEventBase<"testProgress"> {
  /**
   * Progress information containing the test code implementation and related
   * API endpoints.
   *
   * This property contains:
   *
   * 1. The complete test code file that has been automatically generated based on
   *    the test plan specifications, including:
   *
   *    - Test file name
   *    - Implementation content with test cases and assertions
   *    - Setup code for test environment
   * 2. The target API endpoint information that this test validates:
   *
   *    - HTTP path (e.g. "/api/users/{id}")
   *    - HTTP method (GET, POST, PUT, DELETE, PATCH)
   * 3. A list of dependent API endpoints that must be called before running this
   *    test:
   *
   *    - Prerequisites like data creation
   *    - Authentication/authorization steps
   *    - Any other setup operations needed
   *
   * This comprehensive information ensures proper test execution order and
   * validates that the API behaves correctly within the full business workflow
   * context.
   */
  progress: IAutoBeTestProgress.IProgress;

  /**
   * Number of test files that have been completed so far.
   *
   * Indicates the current progress in the test generation process, showing how
   * many test scenario files have been successfully created and implemented.
   * This progress tracking helps stakeholders monitor the advancement of test
   * suite development and estimate completion timing.
   */
  completed: number;

  /**
   * Total number of test files that need to be created.
   *
   * Represents the complete scope of test files required to provide
   * comprehensive validation coverage for all API endpoints and business
   * scenarios. This total count provides context for the completion progress
   * and helps stakeholders understand the overall complexity and scope of the
   * test suite being generated.
   */
  total: number;

  /**
   * Iteration number of the requirements analysis this test progress reflects.
   *
   * Indicates which version of the requirements analysis this test generation
   * work is based on. This step number ensures that the test scenarios are
   * aligned with the current requirements and helps track the development of
   * validation coverage as business requirements and API specifications
   * evolve.
   *
   * The step value enables proper synchronization between test generation
   * activities and the underlying requirements, ensuring that the test suite
   * remains relevant to the current project scope and validation objectives.
   */
  step: number;
}
