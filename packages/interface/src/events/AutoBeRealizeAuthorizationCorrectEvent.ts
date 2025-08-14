import { IAutoBeTypeScriptCompileResult } from "../compiler/IAutoBeTypeScriptCompileResult";
import { AutoBeRealizeAuthorizationCorrect } from "../histories/contents/AutoBeRealizeAuthorizationCorrect";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

/**
 * Event fired during the correction phase of authorization implementation.
 *
 * This event occurs when the TypeScript compiler detects issues in the
 * generated authorization code and the Realize agent attempts to correct these
 * compilation errors. The correction process involves analyzing compiler
 * feedback and regenerating the authorization components to resolve type
 * errors, syntax issues, or other validation problems.
 *
 * @author Michael
 */
export interface AutoBeRealizeAuthorizationCorrectEvent
  extends AutoBeEventBase<"realizeAuthorizationCorrect">,
    AutoBeTokenUsageEventBase {
  /**
   * Authorization configuration being corrected.
   *
   * Contains the authorization implementation details for a specific role that
   * failed compilation and requires correction.
   */
  authorization: AutoBeRealizeAuthorizationCorrect;

  /**
   * The compilation failure details that triggered the correction process.
   *
   * Contains the specific compilation error information describing what
   * validation errors were detected in the authorization implementation code
   * (providers, payloads, decorators). This includes error messages, file
   * locations, type issues, or other compilation problems that prevented
   * successful validation.
   */
  result: IAutoBeTypeScriptCompileResult.IFailure;

  /**
   * Iteration number of the requirements analysis this correction was performed
   * for.
   *
   * Indicates which version of the requirements analysis this authorization
   * correction reflects. This step number ensures that correction efforts are
   * aligned with the current requirements and helps track the evolution of code
   * quality as validation feedback is incorporated.
   */
  step: number;
}
