import { AutoBeTestScenario } from "../histories";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

/**
 * Event fired when the Test agent completes reviewing and validating generated
 * e2e test scenarios.
 *
 * This event occurs after the Test agent has analyzed the initially generated
 * test scenarios, performed quality checks, validation, and potential
 * refinements. The event provides visibility into the review process results
 * and the finalized structure of test scenarios that have passed validation.
 *
 * Each reviewed scenario includes validated test scenarios, confirmed
 * dependency chains, and quality assurance checks to ensure the test cases are
 * robust and ready for execution in the testing pipeline.
 *
 * @author Michael
 */
export interface AutoBeTestScenariosReviewEvent
  extends AutoBeEventBase<"testScenariosReview">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
  /**
   * List of reviewed and validated test scenarios for the target endpoints.
   *
   * Each scenario has undergone review for quality, correctness, and
   * completeness. The scenarios include validated test scenarios, confirmed
   * dependency functions, and any refinements made during the review process.
   * These represent production-ready test cases that have passed validation.
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
