import { AutoBeTestFile } from "../histories/contents/AutoBeTestFile";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Test agent writes and completes individual test scenario
 * files.
 *
 * This event provides real-time visibility into the test file creation process
 * as the Test agent systematically writes test scenarios for each API endpoint.
 * Each write event represents the completion of a specific test file that
 * implements use case scenarios, ensuring comprehensive coverage of API
 * functionality and business logic validation.
 *
 * The write events enable stakeholders to monitor the test suite development
 * and understand how comprehensive validation coverage is being built to ensure
 * the generated application functions correctly under realistic operational
 * conditions and properly implements business requirements.
 *
 * @author Michael
 */
export interface AutoBeTestWriteEvent extends AutoBeEventBase<"testWrite"> {
  /**
   * Complete test file information including location, content, and scenario
   * metadata.
   *
   * Contains all the details about the test file that was just written and
   * completed, including its file system location, the complete TypeScript
   * source code content, and comprehensive scenario metadata describing what
   * this test covers. This unified structure provides rich context about the
   * test's purpose, target API endpoints, and expected behavior patterns.
   *
   * The file information enables better understanding of the test suite
   * development progress and helps stakeholders monitor how comprehensive
   * validation coverage is being built for the generated application.
   */
  file: AutoBeTestFile;

  /**
   * Number of test files that have been written and completed so far.
   *
   * Indicates the current progress in the test file creation process, showing
   * how many test scenario files have been successfully written and
   * implemented. This progress tracking helps stakeholders monitor the
   * advancement of test suite development and estimate completion timing.
   */
  completed: number;

  /**
   * Total number of test files that need to be written.
   *
   * Represents the complete scope of test files required to provide
   * comprehensive validation coverage for all API endpoints and business
   * scenarios. This total count provides context for the completion progress
   * and helps stakeholders understand the overall complexity and scope of the
   * test suite being generated.
   */
  total: number;

  /**
   * Iteration number of the requirements analysis this test writing reflects.
   *
   * Indicates which version of the requirements analysis this test file
   * creation work is based on. This step number ensures that the test scenarios
   * are aligned with the current requirements and helps track the development
   * of validation coverage as business requirements and API specifications
   * evolve.
   *
   * The step value enables proper synchronization between test writing
   * activities and the underlying requirements, ensuring that the test suite
   * remains relevant to the current project scope and validation objectives.
   */
  step: number;
}
