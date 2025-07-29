import { AutoBeRealizeAuthorization } from "./AutoBeRealizeAuthorization";

/** @author Michael */
export interface AutoBeRealizeAuthorizationCorrect
  extends AutoBeRealizeAuthorization {
  /**
   * Step 1: TypeScript compilation error analysis and diagnosis.
   *
   * AI identifies and categorizes all compilation errors (type mismatches,
   * import issues, syntax errors) by component (providers/decorator/payload).
   * Lists specific error messages with their locations and types for
   * systematic troubleshooting.
   */
  error_analysis: string;

  /**
   * Step 2: Solution guidance and fix recommendations.
   *
   * AI provides clear, actionable instructions on how to resolve each
   * identified error. Includes specific steps like "add property X to
   * interface Y", "update import path from A to B", or "change type from C to
   * D". Focus on guidance rather than generating complete code
   * implementations.
   */
  solution_guidance: string;
}
