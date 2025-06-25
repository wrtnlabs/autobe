import { IAutoBeTypeScriptCompilerResult } from "../compiler";
import { AutoBeTestFile } from "../histories";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Test agent corrects compilation failures in the
 * generated test code through the AI self-correction feedback process.
 *
 * This event occurs when the embedded TypeScript compiler detects compilation
 * errors in the test code and the Test agent receives detailed error feedback
 * to correct the issues. The correction process demonstrates the sophisticated
 * feedback loop that enables AI to learn from compilation errors and improve
 * test code quality iteratively.
 *
 * The correction mechanism ensures that test code not only compiles
 * successfully but also properly validates API functionality while maintaining
 * consistency with the established API contracts and business requirements.
 *
 * @author Samchon
 */
export interface AutoBeTestCorrectEvent extends AutoBeEventBase<"testCorrect"> {
  /**
   * Timestamp when the correction process was initiated.
   *
   * Records the exact moment when the compilation error was detected and the
   * correction process began. This timestamp helps track the duration of the
   * self-correction feedback loop and provides temporal context for
   * understanding the iterative improvement process.
   */
  created_at: string;

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
   * The compilation failure details that triggered the correction process.
   *
   * Contains the specific {@link IAutoBeTypeScriptCompilerResult.IFailure}
   * information describing the compilation errors that were detected in the
   * test code. This includes error messages, file locations, type issues, or
   * other compilation problems that prevented successful test code validation.
   *
   * The failure information provides the diagnostic foundation for the AI's
   * understanding of what went wrong and guides the correction strategy.
   */
  result: IAutoBeTypeScriptCompilerResult.IFailure;

  /**
   * AI's initial analysis of the test code before encountering compilation
   * errors.
   *
   * Contains the AI's reasoning process and understanding of the test
   * requirements before compilation feedback was provided. This initial
   * thinking demonstrates the AI's approach to test scenario implementation and
   * provides insight into the original logic that led to the compilation
   * issues.
   *
   * This baseline thinking helps understand the AI's initial interpretation of
   * the requirements and how it evolves through the correction process.
   */
  think_without_compile_error: string;

  /**
   * AI's revised analysis after receiving compilation error feedback.
   *
   * Contains the AI's updated reasoning process after analyzing the compilation
   * errors and understanding what corrections are needed. This revised thinking
   * demonstrates how the AI learns from feedback and adjusts its approach to
   * resolve the identified issues while maintaining test scenario validity.
   *
   * The evolution from initial to revised thinking illustrates the
   * effectiveness of the feedback loop in improving AI-generated code quality.
   */
  think_again_with_compile_error: string;

  /**
   * AI's proposed solution strategy for resolving the compilation issues.
   *
   * Describes the specific approach the AI will take to correct the compilation
   * errors while maintaining the integrity of the test scenarios. The solution
   * strategy explains what changes will be made, why they are necessary, and
   * how they will resolve the issues without compromising test coverage or
   * business logic validation.
   *
   * This solution planning provides transparency into the AI's correction
   * methodology and helps stakeholders understand the quality improvement
   * process.
   */
  solution: string;

  /**
   * Iteration number of the requirements analysis this test correction was
   * performed for.
   *
   * Indicates which version of the requirements analysis this test correction
   * reflects. This step number ensures that the correction efforts are aligned
   * with the current requirements and helps track the quality improvement
   * process as compilation issues are resolved through iterative feedback.
   *
   * The step value enables proper synchronization between test correction
   * activities and the underlying requirements, ensuring that test improvements
   * remain relevant to the current project scope and validation objectives.
   */
  step: number;
}
