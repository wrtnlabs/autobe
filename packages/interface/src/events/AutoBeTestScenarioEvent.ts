import { AutoBeTestScenario } from "../histories";
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
export interface AutoBeTestScenarioEvent
  extends AutoBeEventBase<"testScenario"> {
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
   * Current step in the test generation workflow.
   *
   * Tracks progress through the test creation process, helping coordinate with
   * other pipeline stages and maintain synchronization with the current
   * requirements iteration.
   */
  step: number;
}
