import { IAutoBeTypeScriptCompilerResult } from "../compiler";
import { AutoBeTestFile } from "../histories";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Test agent validates the generated test code using the
 * embedded TypeScript compiler.
 *
 * This event occurs when the Test agent submits the generated test files to the
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
   * Collection of test files that contained compilation errors with their
   * detailed scenario metadata.
   *
   * Contains the structured test file objects that failed compilation before
   * correction. Each file includes its location, problematic source code
   * content, and associated scenario information that provides context for
   * understanding the compilation issues. These files serve as a comprehensive
   * baseline for measuring the effectiveness of the correction process.
   *
   * Unlike simple key-value pairs, this structure preserves the rich metadata
   * about each test scenario, enabling better analysis of what specific test
   * patterns or business logic implementations led to compilation failures and
   * how they can be systematically improved.
   */
  files: AutoBeTestFile[];

  /**
   * Compilation result indicating success, failure, or exception during
   * validation.
   *
   * Contains the complete {@link IAutoBeTypeScriptCompilerResult} from the
   * validation process, which can be:
   *
   * - {@link IAutoBeTypeScriptCompilerResult.ISuccess} for successful compilation
   * - {@link IAutoBeTypeScriptCompilerResult.IFailure} for compilation errors
   * - {@link IAutoBeTypeScriptCompilerResult.IException} for unexpected runtime
   *   errors
   *
   * Success results indicate that the test suite is ready for completion, while
   * failure or exception results trigger the correction feedback loop to
   * improve test code quality and resolve integration issues with the
   * application architecture.
   */
  result:
    | IAutoBeTypeScriptCompilerResult.IFailure
    | IAutoBeTypeScriptCompilerResult.IException
    | IAutoBeTypeScriptCompilerResult.ISuccess;

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
