import { IAutoBeTypeScriptCompileResult } from "../compiler/IAutoBeTypeScriptCompileResult";
import { AutoBeRealizeAuthorization } from "../histories/contents/AutoBeRealizeAuthorization";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired during the validation phase of authorization implementation.
 *
 * This event occurs when the generated authorization code is validated by the
 * TypeScript compiler to ensure type safety, syntax correctness, and proper
 * integration with the NestJS framework. The validation process provides
 * immediate feedback on code quality, enabling rapid iteration and correction
 * of any issues before proceeding with further implementation.
 *
 * @author Michael
 */
export interface AutoBeRealizeAuthorizationValidateEvent
  extends AutoBeEventBase<"realizeAuthorizationValidate"> {
  /**
   * Authorization configuration being validated.
   *
   * Contains the authorization implementation details for a specific role
   * that is undergoing compilation validation.
   */
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
