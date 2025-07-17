import { IValidation } from "typia";

import { IAutoBeTestValidateProps } from "./IAutoBeTestValidateProps";
import { IAutoBeTestWriteProps } from "./IAutoBeTestWriteProps";
import { IAutoBeTypeScriptCompileProps } from "./IAutoBeTypeScriptCompileProps";
import { IAutoBeTypeScriptCompileResult } from "./IAutoBeTypeScriptCompileResult";

/**
 * Interface for the Test compiler that handles E2E test code generation,
 * validation, and compilation for comprehensive backend testing.
 *
 * This compiler provides specialized compilation and validation services for
 * Test agent-generated E2E test functions, ensuring that test code integrates
 * correctly with the NestJS application framework, maintains type safety with
 * API specifications, and produces reliable validation scenarios for backend
 * implementation quality assurance.
 *
 * The Test compiler bridges the gap between test scenario generation and
 * executable validation code, providing sophisticated validation mechanisms
 * that ensure test functions compile correctly, integrate seamlessly with
 * generated APIs, and provide comprehensive coverage of business requirements
 * and functional specifications throughout the validation process.
 *
 * The compiler supports the iterative improvement cycle that enables AI
 * self-correction when test code contains compilation errors, integration
 * issues, or other quality problems that need refinement before test
 * execution.
 *
 * @author Samchon
 */
export interface IAutoBeTestCompiler {
  /**
   * Compiles generated E2E test TypeScript code for validation and execution
   * readiness.
   *
   * Performs comprehensive TypeScript compilation of Test agent-generated E2E
   * test functions to ensure syntactic correctness, type safety, framework
   * integration, and dependency resolution. The compilation process validates
   * that test code properly integrates with NestJS controllers, maintains type
   * alignment with API specifications, correctly imports and utilizes client
   * SDK libraries, and follows established testing patterns and conventions.
   *
   * The compilation includes validation of test scenario logic, verification of
   * API endpoint integration, assessment of business logic testing coverage,
   * and confirmation that test functions will execute correctly in the target
   * testing environment. This comprehensive validation ensures that generated
   * test code is production-ready and capable of providing reliable validation
   * of backend implementation quality.
   *
   * @param props Configuration parameters including test files, database
   *   schemas, package information, and compilation context required for
   *   comprehensive test code validation
   * @returns Promise resolving to complete compilation results including
   *   success status, generated artifacts, or detailed error information for
   *   iterative improvement through AI self-correction
   */
  compile(
    props: IAutoBeTypeScriptCompileProps,
  ): Promise<IAutoBeTypeScriptCompileResult>;

  /**
   * Validates AutoBeTest AST function structure for syntactic correctness and
   * semantic compliance with AutoBeTest specifications.
   *
   * Performs comprehensive validation of the {@link AutoBeTest.IFunction} AST
   * structure to ensure it conforms to AutoBeTest interface specifications,
   * maintains proper expression hierarchies, follows established AST patterns,
   * and can be successfully converted into executable TypeScript test code.
   *
   * The validation process analyzes the AST structure for:
   *
   * - **Syntactic Correctness**: Verifying all AST node types exist in AutoBeTest
   *   namespace and conform to interface specifications
   * - **Type Safety Compliance**: Ensuring expression types align with expected
   *   property requirements throughout the AST hierarchy
   * - **API Integration Validity**: Confirming API operation statements reference
   *   valid endpoints and parameter structures from the OpenAPI document
   * - **Structural Integrity**: Validating statement sequences, expression
   *   relationships, and data flow patterns within the AST
   *
   * When validation errors are detected, detailed error information is provided
   * to enable precise identification and correction of AST structural issues,
   * type mismatches, or specification violations before code generation.
   *
   * @param props AST validation configuration including the AutoBeTest function
   *   structure and OpenAPI document context required for comprehensive AST
   *   validation against specifications
   * @returns Promise resolving to validation error array when AST issues are
   *   detected, or null when the AST structure passes all validation checks
   */
  validate(
    props: IAutoBeTestValidateProps,
  ): Promise<IValidation.IError[] | null>;

  /**
   * Generates complete E2E test function code from validated test scenario
   * specifications.
   *
   * Transforms validated test scenario definitions into complete, executable
   * TypeScript E2E test functions that implement comprehensive business logic
   * validation, API endpoint testing, error handling, and integration
   * scenarios. The generated test code includes proper imports, type-safe API
   * interactions, comprehensive assertion logic, and detailed documentation
   * explaining the test purpose and validation approach.
   *
   * The code generation process ensures that test functions follow established
   * patterns and conventions, properly handle both success and error scenarios,
   * include appropriate setup and cleanup procedures, and provide clear
   * feedback about validation outcomes. The generated code is immediately ready
   * for compilation and execution without requiring manual intervention or
   * debugging.
   *
   * @param props Test writing configuration including scenario specifications,
   *   API context, and generation parameters required for comprehensive test
   *   function creation
   * @returns Promise resolving to complete TypeScript test function code ready
   *   for compilation and execution
   */
  write(props: IAutoBeTestWriteProps): Promise<string>;

  /**
   * Retrieves external dependency files and supporting resources required for
   * test execution environment setup.
   *
   * Provides access to external dependency files, configuration resources,
   * utility functions, and supporting infrastructure code that E2E test
   * functions require for proper execution. This includes testing framework
   * dependencies, helper utilities, configuration files, and any additional
   * resources needed to create a complete test execution environment.
   *
   * The external resources ensure that generated test functions have access to
   * all necessary dependencies and utilities, enabling comprehensive testing
   * capabilities including database interaction helpers, API client utilities,
   * assertion libraries, and testing infrastructure that supports reliable
   * validation of backend implementation quality.
   *
   * @returns Promise resolving to key-value pairs mapping resource names to
   *   external dependency content required for comprehensive test execution
   *   environment setup
   */
  getExternal(): Promise<Record<string, string>>;

  getTemplate(): Promise<Record<string, string>>;
}
