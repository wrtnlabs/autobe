import { IAutoBeTypeScriptCompileResult } from "../compiler";
import { AutoBeTestWriteFunction } from "../histories";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

/**
 * Event fired when the Test agent validates the generated test code using the
 * embedded TypeScript compiler.
 *
 * This event occurs when the Test agent submits a generated test file to the
 * TypeScript compiler for validation, ensuring that the test code compiles
 * correctly and integrates properly with the API specifications and database
 * schemas. The validation process serves as a quality gate that ensures test
 * scenarios are syntactically correct and semantically valid.
 *
 * The validation results determine whether the test generation process can
 * proceed to completion or whether correction feedback is needed to resolve
 * compilation issues and improve test code quality through the iterative
 * self-correction mechanism.
 *
 * @author Michael
 */
export interface AutoBeTestValidateEvent
  extends AutoBeEventBase<"testValidate"> {
  /**
   * Function type indicating the specific test writing operation performed.
   *
   * This discriminated union represents different stages and types of test code
   * generation that occur during the test writing process:
   *
   * - `AutoBeTestPrepareWriteFunction`: Generates test data preparation functions
   *   that create mock DTO objects required by API endpoints
   * - `AutoBeTestGenerationWriteFunction`: Creates resource generation functions
   *   that produce test data and utilities needed by test scenarios
   * - `AutoBeTestAuthorizationWriteFunction`: Implements authentication and
   *   authorization functions for different actors (login, signup, token
   *   refresh)
   * - `AutoBeTestWriteFunction`: Writes the actual E2E test scenario files with
   *   complete test implementations
   *
   * Each function type serves a specific purpose in building comprehensive test
   * suites, from data preparation through authentication to actual scenario
   * validation. The discriminated union pattern enables type-safe handling of
   * different test writing stages while providing detailed progress tracking.
   */
  function: AutoBeTestWriteFunction;

  /**
   * Compilation result indicating success, failure, or exception during
   * validation.
   *
   * Contains the complete {@link IAutoBeTypeScriptCompileResult} from the
   * validation process, which can be:
   *
   * - {@link IAutoBeTypeScriptCompileResult.ISuccess} for successful compilation
   * - {@link IAutoBeTypeScriptCompileResult.IFailure} for compilation errors
   * - {@link IAutoBeTypeScriptCompileResult.IException} for unexpected runtime
   *   errors
   *
   * Success results indicate that the test suite is ready for completion, while
   * failure or exception results trigger the correction feedback loop to
   * improve test code quality and resolve integration issues with the
   * application architecture.
   */
  result: IAutoBeTypeScriptCompileResult;

  /**
   * Iteration number of the requirements analysis this test validation was
   * performed for.
   *
   * Indicates which version of the requirements analysis this test validation
   * reflects. This step number ensures that the validation process is aligned
   * with the current requirements and helps track the quality assurance process
   * as test scenarios are validated and refined.
   *
   * The step value enables proper synchronization between validation activities
   * and the underlying requirements, ensuring that test validation efforts
   * remain relevant to the current project scope and validation objectives.
   */
  step: number;
}
