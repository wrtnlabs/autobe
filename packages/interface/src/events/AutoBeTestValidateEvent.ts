import { IAutoBeTypeScriptCompilerResult } from "../compiler";
import { IAutoBeTestPlan } from "../test/AutoBeTestPlan";
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
   * Test files being validated by the TypeScript compiler as key-value pairs.
   *
   * Contains the TypeScript test files that are undergoing compilation
   * validation. Each key represents the file path and each value contains the
   * test code that includes standalone functions implementing specific use case
   * scenarios for API endpoints. These files represent the current state of
   * test implementation that needs validation.
   *
   * The files provide context for understanding what test scenarios are being
   * validated and serve as the foundation for either successful completion or
   * correction feedback depending on the compilation results.
   */
  files: Record<
    string,
    { content: string; scenario?: IAutoBeTestPlan.IScenario }
  >;

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
