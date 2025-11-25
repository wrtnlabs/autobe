import {
  AutoBeTestWriteAuthorizationFunction,
  AutoBeTestWriteFunction,
  AutoBeTestWriteGenerationFunction,
  AutoBeTestWritePrepareFunction,
} from "../histories";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

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
    AutoBeAggregateEventBase {
  /**
   * Function type indicating the specific test writing operation performed.
   *
   * This discriminated union represents different stages and types of test
   * code generation that occur during the test writing process:
   *
   * - `AutoBeTestWritePrepareFunction`: Generates test data preparation functions
   *   that create mock DTO objects required by API endpoints
   * - `AutoBeTestWriteGenerationFunction`: Creates resource generation functions
   *   that produce test data and utilities needed by test scenarios
   * - `AutoBeTestWriteAuthorizationFunction`: Implements authentication and
   *   authorization functions for different actors (login, signup, token refresh)
   * - `AutoBeTestWriteFunction`: Writes the actual E2E test scenario files with
   *   complete test implementations
   *
   * Each function type serves a specific purpose in building comprehensive test
   * suites, from data preparation through authentication to actual scenario
   * validation. The discriminated union pattern enables type-safe handling of
   * different test writing stages while providing detailed progress tracking.
   */
  function:
    | AutoBeTestWritePrepareFunction
    | AutoBeTestWriteGenerationFunction
    | AutoBeTestWriteAuthorizationFunction
    | AutoBeTestWriteFunction;

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
