import { AutoBeTestScenario } from "../histories";
import { IAutoBeTokenUsageJson } from "../json/IAutoBeTokenUsageJson";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Test agent generates e2e test scenarios for specific API
 * endpoints.
 *
 * This event occurs when the Test agent analyzes API endpoints and creates test
 * scenarios that include the main function to test and any dependency functions
 * that need to be called first. The event provides visibility into the test
 * generation progress and the structure of generated test cases.
 *
 * Each scenario includes draft test code and a clear dependency chain that
 * ensures tests can execute successfully with proper data setup and
 * prerequisites.
 *
 * @author Kakasoo
 */
export interface AutoBeTestScenariosEvent
  extends AutoBeEventBase<"testScenarios"> {
  /**
   * List of test scenarios generated for the target endpoints.
   *
   * Each scenario contains the endpoint to test, generated test code draft, and
   * any dependency functions that must be called before the main test. The
   * scenarios represent complete test cases ready for compilation and
   * execution.
   */
  scenarios: AutoBeTestScenario[];

  /**
   * Token usage metrics for test scenario generation.
   *
   * Records the AI token consumption during the test scenario planning phase,
   * where the Test agent analyzes API endpoints and generates comprehensive
   * test scenarios with dependency chains. This includes tokens used for
   * understanding endpoint functionality, creating test case structures, and
   * drafting initial test code implementations.
   */
  tokenUsage: IAutoBeTokenUsageJson.IComponent;

  /**
   * Number of test scenarios completed.
   *
   * Tracks how many test scenarios have been successfully generated so far.
   * This provides real-time progress indication during the test generation
   * process, allowing monitoring of completion status.
   */
  completed: number;

  /**
   * Total number of test scenarios to generate.
   *
   * Represents the total count of API endpoints that require test scenario
   * generation. Used together with the completed field to calculate progress
   * percentage and estimate remaining work.
   */
  total: number;

  /**
   * Current step in the test generation workflow.
   *
   * Tracks progress through the test creation process, helping coordinate with
   * other pipeline stages and maintain synchronization with the current
   * requirements iteration.
   */
  step: number;
}
