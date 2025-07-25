import { IAutoBeTypeScriptCompileResult } from "../compiler/IAutoBeTypeScriptCompileResult";
import { AutoBeRealizeAuthorization } from "../histories/contents/AutoBeRealizeAuthorization";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeRealizeAuthorizationCorrectEvent
  extends AutoBeEventBase<"realizeAuthorizationCorrect"> {
  authorization: AutoBeRealizeAuthorization;

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
