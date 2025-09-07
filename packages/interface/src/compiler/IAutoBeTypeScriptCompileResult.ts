/**
 * Result of TypeScript compilation and validation operations.
 *
 * This union type represents all possible outcomes when the TypeScript compiler
 * processes generated code from the Test and Realize agents. The compilation
 * results enable AI self-correction through detailed feedback mechanisms while
 * ensuring that all generated code meets production standards and integrates
 * seamlessly with the TypeScript ecosystem.
 *
 * The compilation process validates framework integration, type system
 * integrity, dependency resolution, and build compatibility. Success results
 * indicate production-ready code, while failure results provide detailed
 * diagnostics for iterative refinement through the AI feedback loop.
 *
 * @author Samchon
 */
export type IAutoBeTypeScriptCompileResult =
  | IAutoBeTypeScriptCompileResult.ISuccess
  | IAutoBeTypeScriptCompileResult.IFailure
  | IAutoBeTypeScriptCompileResult.IException;

export namespace IAutoBeTypeScriptCompileResult {
  /**
   * Successful compilation result with generated JavaScript output.
   *
   * Represents the ideal outcome where TypeScript compilation completed without
   * errors and produced clean JavaScript code ready for execution. This result
   * indicates that the generated TypeScript code meets all production
   * standards, integrates correctly with frameworks and dependencies, and
   * maintains complete type safety throughout the application stack.
   */
  export interface ISuccess {
    /** Discriminator indicating successful compilation. */
    type: "success";

    // /**
    //  * Generated JavaScript files as key-value pairs.
    //  *
    //  * Contains the compiled JavaScript output with each key representing the
    //  * output file path and each value containing the generated JavaScript code.
    //  * The compiled code is ready for execution in Node.js environments and
    //  * maintains all functionality specified in the original TypeScript source
    //  * while ensuring optimal runtime performance.
    //  */
    // javascript: Record<string, string>;
  }

  /**
   * Compilation failure with detailed diagnostic information and partial
   * output.
   *
   * Represents cases where TypeScript compilation encountered errors or
   * warnings that prevent successful code generation. This result provides
   * comprehensive diagnostic information to enable AI agents to understand
   * specific issues and implement targeted corrections through the iterative
   * refinement process.
   */
  export interface IFailure {
    /** Discriminator indicating compilation failure. */
    type: "failure";

    /**
     * Detailed compilation diagnostics for error analysis and correction.
     *
     * Contains comprehensive information about compilation errors, warnings,
     * and suggestions that occurred during the TypeScript compilation process.
     * Each diagnostic includes file location, error category, diagnostic codes,
     * and detailed messages that enable AI agents to understand and resolve
     * specific compilation issues.
     */
    diagnostics: IDiagnostic[];

    // /**
    //  * Partial JavaScript output despite compilation failures.
    //  *
    //  * Contains any JavaScript code that was successfully generated before
    //  * compilation failures occurred. This partial output can provide context
    //  * for understanding which parts of the code compiled correctly and which
    //  * areas require correction during the AI feedback and refinement process.
    //  */
    // javascript: Record<string, string>;
  }

  /**
   * Unexpected exception during the compilation process.
   *
   * Represents cases where the TypeScript compilation process encountered an
   * unexpected runtime error or system exception that prevented normal
   * compilation operation. These cases indicate potential issues with the
   * compilation environment or unexpected edge cases that should be
   * investigated.
   */
  export interface IException {
    /** Discriminator indicating compilation exception. */
    type: "exception";

    /**
     * The raw error or exception that occurred during compilation.
     *
     * Contains the original error object or exception details for debugging
     * purposes. This information helps developers identify the root cause of
     * unexpected compilation failures and improve system reliability while
     * maintaining the robustness of the automated development pipeline.
     */
    error: unknown;
  }

  /**
   * Detailed diagnostic information for compilation issues.
   *
   * Provides comprehensive details about specific compilation problems
   * including file locations, error categories, diagnostic codes, and
   * descriptive messages. This information is essential for AI agents to
   * understand compilation failures and implement precise corrections during
   * the iterative development process.
   *
   * @author Samchon
   */
  export interface IDiagnostic {
    /**
     * Source file where the diagnostic was generated.
     *
     * Specifies the TypeScript source file that contains the issue, or null if
     * the diagnostic applies to the overall compilation process rather than a
     * specific file. This information helps AI agents target corrections to the
     * appropriate source files during the refinement process.
     */
    file: string | null;

    /**
     * Category of the diagnostic message.
     *
     * Indicates the severity and type of the compilation issue, enabling AI
     * agents to prioritize fixes and understand the impact of each diagnostic.
     * Errors must be resolved for successful compilation, while warnings and
     * suggestions can guide code quality improvements.
     */
    category: DiagnosticCategory;

    /**
     * TypeScript diagnostic code for the specific issue.
     *
     * Provides the official TypeScript diagnostic code that identifies the
     * specific type of compilation issue. This code can be used to look up
     * detailed explanations and resolution strategies in TypeScript
     * documentation or automated correction systems.
     */
    code: number | string;

    /**
     * Character position where the diagnostic begins in the source file.
     *
     * Specifies the exact location in the source file where the issue starts,
     * or undefined if the diagnostic doesn't apply to a specific location. This
     * precision enables AI agents to make targeted corrections without
     * affecting unrelated code sections.
     */
    start: number | null | undefined;

    /**
     * Length of the text span covered by this diagnostic.
     *
     * Indicates how many characters from the start position are affected by
     * this diagnostic, or undefined if the diagnostic doesn't apply to a
     * specific text span. This information helps AI agents understand the scope
     * of corrections needed for each issue.
     */
    length: number | null | undefined;

    /**
     * Human-readable description of the compilation issue.
     *
     * Provides a detailed explanation of the compilation problem in natural
     * language that AI agents can analyze to understand the issue and formulate
     * appropriate corrections. The message text includes context and
     * suggestions for resolving the identified problem.
     */
    messageText: string;
  }

  /**
   * Categories of TypeScript diagnostic messages.
   *
   * Defines the severity levels and types of compilation diagnostics that can
   * be generated during TypeScript compilation. These categories help AI agents
   * prioritize fixes and understand the impact of each compilation issue on the
   * overall code quality and functionality.
   *
   * @author Samchon
   */
  export type DiagnosticCategory =
    | "warning" // Issues that don't prevent compilation but indicate potential problems
    | "error" // Critical issues that prevent successful compilation and must be fixed
    | "suggestion" // Recommendations for code improvements that enhance quality
    | "message"; // Informational messages about the compilation process
}
