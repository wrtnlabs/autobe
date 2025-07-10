import { IAutoBeTypeScriptCompileResult } from "../compiler";
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
   * The test file that contained compilation errors with its detailed scenario
   * metadata.
   *
   * Contains the structured test file object that failed compilation before
   * correction. The file includes its location, problematic source code
   * content, and associated scenario information that provides context for
   * understanding the compilation issues. This file serves as a comprehensive
   * baseline for measuring the effectiveness of the correction process.
   *
   * Unlike simple key-value pairs, this structure preserves the rich metadata
   * about the test scenario, enabling better analysis of what specific test
   * patterns or business logic implementations led to compilation failures and
   * how they can be systematically improved.
   */
  file: AutoBeTestFile;

  /**
   * The compilation failure details that triggered the correction process.
   *
   * Contains the specific {@link IAutoBeTypeScriptCompileResult.IFailure}
   * information describing the compilation errors that were detected in the
   * test code. This includes error messages, file locations, type issues, or
   * other compilation problems that prevented successful test code validation.
   *
   * The failure information provides the diagnostic foundation for the AI's
   * understanding of what went wrong and guides the correction strategy.
   */
  result: IAutoBeTypeScriptCompileResult.IFailure;

  /**
   * AI's initial analysis of the test scenario without compilation error
   * context.
   *
   * Contains the AI's clean analysis of the original test scenario, business
   * requirements, and intended functionality before considering compilation
   * errors. This analysis establishes a clear understanding of what the test
   * should accomplish and the expected business workflow.
   *
   * This baseline thinking helps maintain the original test purpose during
   * error correction and provides insight into the AI's initial interpretation
   * of the requirements.
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
   * The first corrected version of the test code addressing compilation errors.
   *
   * Contains the AI's initial attempt to fix the compilation issues while
   * preserving the original business logic and test workflow. This draft
   * represents the direct application of error correction strategies identified
   * during the analysis phase.
   *
   * The draft code demonstrates the AI's approach to resolving TypeScript
   * compilation errors while maintaining the intended test functionality and
   * following established conventions.
   */
  draft: string;

  /**
   * AI's comprehensive review and validation of the corrected draft code.
   *
   * Contains the AI's evaluation of the draft implementation, examining both
   * technical correctness and business logic preservation. This review process
   * identifies any remaining issues and validates that compilation errors have
   * been properly resolved.
   *
   * The review provides insight into the AI's quality assurance process and
   * helps stakeholders understand how the correction maintains test integrity.
   */
  review: string;

  /**
   * The final production-ready corrected test code.
   *
   * Contains the polished version of the corrected test code that incorporates
   * all review feedback and validation results. This represents the completed
   * error correction process, guaranteed to compile successfully while
   * preserving all original test functionality.
   *
   * The final implementation serves as the definitive solution that replaces
   * the compilation-failed code and demonstrates the AI's ability to learn from
   * errors and produce high-quality test code.
   */
  final: string;

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
