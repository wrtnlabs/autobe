/**
 * Base interface for AutoBE test write function types.
 *
 * This interface defines the common properties shared by all test write
 * function types in the AutoBE system, including authorization, preparation,
 * generation, and main test functions.
 *
 * @author Michael
 */
export interface AutoBeTestWriteFunctionBase<Type extends string> {
  /**
   * Discriminator field that identifies the specific type of test function.
   * Used for discriminated union pattern to distinguish between different test
   * function types.
   */
  type: Type;

  /**
   * The file system location where this test function will be written. Should
   * be an absolute or relative path to the target test file.
   */
  location: string;

  /**
   * The complete source code content of the test function. Contains the full
   * implementation including function signature and body.
   */
  content: string;

  /**
   * The name identifier of the function. Used to reference the function within
   * the test suite.
   */
  functionName: string;
}
