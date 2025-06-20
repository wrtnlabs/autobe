import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Test agent completes the e2e test code generation
 * process for all API endpoints and scenarios.
 *
 * This event represents the successful completion of comprehensive test suite
 * creation that validates both technical functionality and business rule
 * implementation across all API operations. The Test agent's completion ensures
 * that every API endpoint has multiple use case scenarios implemented as test
 * programs that provide thorough coverage of the application functionality.
 *
 * The completion of test generation creates a robust validation framework that
 * ensures the generated APIs work correctly under realistic operational
 * conditions and properly implement all business requirements established in
 * the analysis phase.
 *
 * @author Samchon
 */
export interface AutoBeTestCompleteEvent
  extends AutoBeEventBase<"testComplete"> {
  /**
   * Generated e2e test files as key-value pairs representing the complete test
   * suite.
   *
   * Contains the final set of TypeScript test files with each key representing
   * the file path and each value containing the actual test code. Each test
   * file includes standalone functions that implement specific use case
   * scenarios for API endpoints, providing comprehensive end-to-end testing
   * coverage that validates both technical functionality and business logic
   * implementation.
   *
   * The test files are designed to work under realistic operational conditions,
   * ensuring that the generated APIs not only compile and execute correctly but
   * also properly implement the business requirements and handle edge cases
   * appropriately. These tests serve as both validation tools and documentation
   * of expected system behavior.
   */
  files: Record<string, string>;

  /**
   * Final iteration number of the requirements analysis this test suite was
   * completed for.
   *
   * Indicates which version of the requirements analysis this test suite
   * reflects, representing the synchronization point between test scenarios and
   * business requirements. This step number confirms that the completed test
   * suite validates the latest requirements and incorporates all API
   * specifications and database design decisions from the current development
   * iteration.
   *
   * The step value serves as the definitive reference for the test coverage
   * scope, ensuring that all stakeholders understand which requirements version
   * has been comprehensively validated through the generated test scenarios.
   */
  step: number;
}
