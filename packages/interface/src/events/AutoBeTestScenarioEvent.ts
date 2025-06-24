import { AutoBeOpenApi } from "../openapi";
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
  scenarios: AutoBeTestScenarioEvent.IScenario[];

  /**
   * Current step in the test generation workflow.
   *
   * Tracks progress through the test creation process, helping coordinate with
   * other pipeline stages and maintain synchronization with the current
   * requirements iteration.
   */
  step: number;
}

export namespace AutoBeTestScenarioEvent {
  /**
   * A single test scenario for an API endpoint.
   *
   * Contains everything needed to test a specific function: the target
   * endpoint, generated test code, and any prerequisite functions that must be
   * called to set up proper test conditions.
   */
  export interface IScenario {
    /**
     * The API endpoint being tested.
     *
     * Contains the complete endpoint specification including URL, method,
     * parameters, and expected responses that will be validated by this test
     * scenario.
     */
    endpoint: AutoBeOpenApi.IEndpoint;

    /**
     * Generated test code for this endpoint.
     *
     * Initial test implementation created by the AI agent. This code may be
     * refined through compilation feedback and validation cycles.
     */
    draft: string;

    /**
     * Name of the function being tested.
     *
     * The identifier of the API function that this test case targets, used for
     * organizing and tracking test results.
     */
    functionName: string;

    /**
     * Functions that must be called before running the main test.
     *
     * Dependencies required to set up test data, authenticate users, create
     * resources, or establish other conditions needed for the test to execute
     * successfully.
     */
    dependencies: IDependency[];
  }

  /**
   * A dependency function that must be called before the main test.
   *
   * Represents a prerequisite API call needed to prepare the system state for
   * successful test execution.
   */
  export interface IDependency {
    /**
     * Why this dependency is needed.
     *
     * Explains the role of this prerequisite function in setting up the
     * conditions required for the main test to succeed.
     */
    purpose: string;

    /**
     * The API endpoint for this dependency function.
     *
     * Complete specification of the prerequisite function that needs to be
     * called, including parameters and expected behavior.
     */
    endpoint: AutoBeOpenApi.IEndpoint;
  }
}
