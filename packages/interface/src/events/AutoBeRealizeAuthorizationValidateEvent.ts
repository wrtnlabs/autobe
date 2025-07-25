import { IAutoBeTypeScriptCompileResult } from "../compiler/IAutoBeTypeScriptCompileResult";
import { AutoBeRealizeAuthorization } from "../histories/contents/AutoBeRealizeAuthorization";
import { AutoBeEventBase } from "./AutoBeEventBase";

export interface AutoBeRealizeAuthorizationValidateEvent
  extends AutoBeEventBase<"realizeAuthorizationValidate"> {
  authorization: AutoBeRealizeAuthorization;

  /**
   * The validation result from the TypeScript compiler.
   *
   * Contains detailed information about whether the decorator implementation
   * code successfully passed compilation validation, including any errors or
   * warnings that were detected during the validation process.
   */
  result: IAutoBeTypeScriptCompileResult;

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
