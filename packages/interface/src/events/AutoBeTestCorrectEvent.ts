import { IAutoBeTypeScriptCompileResult } from "../compiler";
import { AutoBeTestFunction } from "../histories";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";

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
export interface AutoBeTestCorrectEvent
  extends AutoBeEventBase<"testCorrect">,
    AutoBeAggregateEventBase {
  kind: "casting" | "overall" | "request";

  /**
   * The test function that contained compilation errors.
   *
   * Contains the specific test function object that failed compilation,
   * including its metadata, location, and source code. This can be any type of
   * test function: prepare, generation, authorization, or main test write
   * function. The function type determines which specialized correction
   * strategy will be applied.
   */
  function: AutoBeTestFunction;

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
