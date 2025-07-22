import { IAutoBeTypeScriptCompileResult } from "../compiler";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Realize decorator agent validates the generated
 * decorator implementation code.
 *
 * This event occurs when the embedded TypeScript compiler validates the
 * decorator code to ensure it meets all compilation requirements. The
 * validation process is a critical step in maintaining code quality and
 * catching potential issues early in the development cycle.
 *
 * @author Michael
 */
export interface AutoBeRealizeDecoratorValidateEvent
  extends AutoBeEventBase<"realizeDecoratorValidate"> {
  /**
   * The validation result from the TypeScript compiler.
   *
   * Contains detailed information about whether the decorator implementation
   * code successfully passed compilation validation, including any errors or
   * warnings that were detected during the validation process.
   */
  result: IAutoBeTypeScriptCompileResult;

  /**
   * Generated decorator and provider files as key-value pairs.
   *
   * Contains the TypeScript implementation files that were generated for the
   * decorator and provider. Each key represents the file path and each value
   * contains the actual implementation code that was validated.
   */
  files: Record<string, string>;

  /**
   * Iteration number of the requirements analysis this validation was performed
   * for.
   *
   * Indicates which version of the requirements analysis this validation
   * reflects. This step number ensures that validation efforts are aligned with
   * the current requirements and helps track code quality evolution through the
   * development process.
   */
  step: number;
}
