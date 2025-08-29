import { IAutoBeRealizeAuthorizationApplication } from "./IAutoBeRealizeAuthorizationApplication";

export interface IAutoBeRealizeAuthorizationCorrectApplication {
  /**
   * Corrects TypeScript compilation errors in authentication components.
   *
   * This method analyzes and fixes compilation errors in previously generated
   * authentication provider, decorator, and payload type implementations. It
   * performs systematic error diagnosis and generates corrected versions of
   * all three components while maintaining their interconnected functionality.
   *
   * The correction process includes:
   * - TypeScript error analysis and categorization by component
   * - Identification of type mismatches, import issues, and syntax errors
   * - Clear solution guidance for each identified problem
   * - Regeneration of all components with fixes applied
   *
   * The corrected components maintain the same naming conventions and
   * architectural patterns as the original generation while resolving all
   * compilation issues.
   *
   * @param next Properties containing error analysis, solution guidance, and corrected components
   */
  correctDecorator: (
    next: IAutoBeRealizeAuthorizationCorrectApplication.IProps,
  ) => void;
}

export namespace IAutoBeRealizeAuthorizationCorrectApplication {
  export interface IProps
    extends IAutoBeRealizeAuthorizationApplication.IProps {
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
}
