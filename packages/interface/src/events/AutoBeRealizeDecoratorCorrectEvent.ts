import { IAutoBeTypeScriptCompileResult } from "../compiler";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Realize decorator agent corrects compilation failures in
 * the generated decorator implementation code.
 *
 * This event occurs when the embedded TypeScript compiler detects compilation
 * errors in the decorator code and the Realize agent receives detailed error
 * feedback to correct the issues. The correction process demonstrates the
 * sophisticated feedback loop that enables AI to learn from compilation errors
 * and improve code quality iteratively.
 *
 * @author Michael
 */
export interface AutoBeRealizeDecoratorCorrectEvent
  extends AutoBeEventBase<"realizeDecoratorCorrect"> {
  /**
   * Generated decorator and provider files as key-value pairs.
   *
   * Contains the TypeScript implementation files that were generated for the
   * decorator and provider. Each key represents the file path and each value
   * contains the actual implementation code that makes the application
   * functional. This file includes default template files, the decorator and
   * provider files.
   */
  files: Record<string, string>;

  /**
   * The compilation failure details that triggered the correction process.
   *
   * Contains the specific compilation error information describing what
   * validation errors were detected in the decorator implementation code. This
   * includes error messages, file locations, type issues, or other compilation
   * problems that prevented successful validation.
   */
  result: IAutoBeTypeScriptCompileResult.IFailure;

  /**
   * Iteration number of the requirements analysis this correction was performed
   * for.
   *
   * Indicates which version of the requirements analysis this decorator
   * correction reflects. This step number ensures that correction efforts are
   * aligned with the current requirements and helps track the evolution of code
   * quality as validation feedback is incorporated.
   */
  step: number;
}
