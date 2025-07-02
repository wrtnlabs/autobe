import { IAutoBeTypeScriptCompileResult } from "../compiler/IAutoBeTypeScriptCompileResult";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Realize agent validates the generated implementation
 * code and encounters compilation errors that need correction.
 *
 * This event occurs when the embedded TypeScript compiler processes the
 * generated implementation files and detects compilation failures or exceptions
 * that prevent successful code validation. The validation process ensures that
 * the implementation code properly integrates with the previously generated API
 * controllers, DTOs, and database schemas while maintaining type safety
 * throughout the application stack.
 *
 * The validation event triggers the feedback loop that enables AI
 * self-correction, providing detailed compilation error information that helps
 * the Realize agent understand implementation issues and maintain alignment
 * with established architectural contracts.
 *
 * @author Samchon
 */
export interface AutoBeRealizeValidateEvent
  extends AutoBeEventBase<"realizeValidate"> {
  /**
   * Implementation files that failed compilation validation as key-value pairs.
   *
   * Contains the TypeScript implementation files that were generated but failed
   * to pass compilation validation. Each key represents the file path and each
   * value contains the implementation code that contains compilation errors or
   * integration issues. These files provide context for understanding what was
   * attempted and where the problems occurred.
   *
   * Having access to the failing implementation files enables detailed analysis
   * of the compilation issues and helps in formulating precise corrections that
   * address specific problems while maintaining integration with the
   * established API and database architecture.
   */
  files: Record<string, string>;

  /**
   * Compilation failure or exception details describing what errors were
   * detected.
   *
   * Contains either {@link IAutoBeTypeScriptCompileResult.IFailure} for
   * compilation errors or {@link IAutoBeTypeScriptCompileResult.IException} for
   * unexpected runtime errors during the compilation process. The result
   * provides comprehensive diagnostic information including error messages,
   * file locations, and specific issues that prevent successful compilation.
   *
   * The failure information provides the diagnostic context necessary for the
   * AI to understand compilation problems and formulate appropriate corrections
   * that resolve implementation issues while maintaining consistency with the
   * overall application architecture.
   */
  result:
    | IAutoBeTypeScriptCompileResult.IFailure
    | IAutoBeTypeScriptCompileResult.IException;

  /**
   * Iteration number of the requirements analysis this validation was performed
   * for.
   *
   * Indicates which version of the requirements analysis this implementation
   * validation reflects. This step number ensures that the validation feedback
   * is aligned with the current requirements and helps track the quality
   * improvement process as compilation issues are identified and resolved.
   *
   * The step value enables proper synchronization between validation activities
   * and the underlying requirements, ensuring that implementation correction
   * efforts remain relevant to the current project scope and business
   * objectives.
   */
  step: number;
}
