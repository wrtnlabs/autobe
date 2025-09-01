import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

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
export interface AutoBeTestWriteEvent
  extends AutoBeEventBase<"testWrite">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
  /**
   * File system path where the test file should be located.
   *
   * Specifies the relative or absolute path for the test file within the
   * project structure. This location typically follows testing conventions and
   * may be organized by API endpoints, feature modules, or business domains to
   * ensure logical test suite organization and easy navigation.
   *
   * Example: "test/features/api/order/test_api_shopping_order_publish.ts"
   */
  location: string;

  /**
   * Test scenario description and implementation strategy.
   *
   * Detailed explanation of the business scenario to be tested, including
   * step-by-step execution plan and test methodology.
   */
  scenario: string;

  /**
   * Functional domain category for test organization.
   *
   * Primary API resource domain (e.g., "user", "article", "payment") used for
   * file structure and logical test grouping.
   */
  domain: string;

  /**
   * Initial test code implementation.
   *
   * First working version of the TypeScript E2E test function, implementing the
   * complete business scenario with proper types and SDK usage.
   */
  draft: string;

  /**
   * Code review feedback and improvement suggestions.
   *
   * Quality assessment results identifying issues, best practice violations,
   * and specific recommendations for code refinement.
   */
  review?: string;

  /**
   * Final production-ready test code.
   *
   * Polished implementation incorporating all review feedback, ready for
   * deployment in the actual test suite.
   */
  final?: string;

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
