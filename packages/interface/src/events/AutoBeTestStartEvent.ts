import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Test agent begins the e2e test code generation process.
 *
 * This event marks the initiation of comprehensive test suite creation based on
 * the previous requirements analysis, database design, and RESTful API
 * specification. The Test agent start represents the beginning of the
 * validation layer development that ensures the generated application functions
 * correctly under realistic operational conditions and properly implements
 * business requirements.
 *
 * The test generation process that begins with this event will conceive
 * multiple use case scenarios for each API endpoint and implement them as test
 * programs, providing thorough coverage of both technical functionality and
 * business logic validation throughout the application ecosystem.
 *
 * @author Samchon
 */
export interface AutoBeTestStartEvent extends AutoBeEventBase<"testStart"> {
  /**
   * Reason why the Test agent was activated through function calling.
   *
   * Explains the specific circumstances that triggered the AI chatbot to invoke
   * the Test agent via function calling. This could include reasons such as
   * initial test suite generation after API specification completion, updating
   * test scenarios due to API changes, regenerating tests to reflect modified
   * business requirements or database schemas, or creating additional test
   * coverage for new functionality.
   *
   * Understanding the activation reason provides context for the test
   * generation scope and helps stakeholders understand whether this represents
   * initial test development, refinement of existing test scenarios, or
   * expansion of validation coverage.
   */
  reason: string;

  /**
   * Iteration number of the requirements analysis this test generation is being
   * started for.
   *
   * Indicates which version of the requirements analysis this test suite will
   * validate. This step number ensures that the Test agent works with the
   * current requirements and helps track the evolution of test scenarios as
   * business requirements, database schemas, and API specifications change.
   *
   * The step value enables proper synchronization between test generation
   * activities and the underlying requirements, ensuring that the test suite
   * remains aligned with the current project scope and validation objectives
   * throughout the iterative development process.
   */
  step: number;
}
