import { AutoBeTestAuthorizationWriteFunction } from "./AutoBeTestAuthorizationWriteFunction";
import { AutoBeTestGenerationWriteFunction } from "./AutoBeTestGenerationWriteFunction";
import { AutoBeTestOperationWriteFunction } from "./AutoBeTestOperationWriteFunction";
import { AutoBeTestPrepareWriteFunction } from "./AutoBeTestPrepareWriteFunction";

/**
 * Union type representing all possible test write function types in AutoBE.
 *
 * This discriminated union encompasses all test file generation operations:
 *
 * - `AutoBeTestPrepareWriteFunction`: Generates test data preparation functions
 *   that create mock DTO objects required by API endpoints
 * - `AutoBeTestGenerationWriteFunction`: Creates resource generation functions
 *   that produce test data and utilities needed by test scenarios
 * - `AutoBeTestAuthorizationWriteFunction`: Implements authentication and
 *   authorization functions for different actors (login, signup, token refresh)
 * - `AutoBeTestOperationWriteFunction`: Writes the actual E2E test scenario files
 *   with complete test implementations
 *
 * Each function type serves a specific purpose in building comprehensive test
 * suites, from data preparation through authentication to actual scenario
 * validation. The discriminated union pattern enables type-safe handling of
 * different test writing stages while providing detailed progress tracking.
 *
 * @author Michael
 */
export type AutoBeTestWriteFunction =
  | AutoBeTestPrepareWriteFunction
  | AutoBeTestGenerationWriteFunction
  | AutoBeTestAuthorizationWriteFunction
  | AutoBeTestOperationWriteFunction;

export namespace AutoBeTestWriteFunction {
  /**
   * Type literal union of all possible test write function kind strings.
   *
   * Provides a compile-time enumeration of all function kinds that can occur
   * during test generation. This type is extracted from the discriminant
   * union property of the AutoBeTestWriteFunction type and is useful for
   * type guards, switch statements, and function filtering logic.
   */
  export type Type = AutoBeTestWriteFunction["kind"];

  /**
   * Type mapping interface that associates function kind strings with their
   * corresponding function object types.
   *
   * This mapping provides a type-safe way to access specific function types
   * by their string identifiers, enabling generic function handling patterns
   * and type-safe filtering mechanisms.
   */
  export type Mapper = {
    prepare: AutoBeTestPrepareWriteFunction;
    generation: AutoBeTestGenerationWriteFunction;
    authorization: AutoBeTestAuthorizationWriteFunction;
    operation: AutoBeTestOperationWriteFunction;
  };
}
