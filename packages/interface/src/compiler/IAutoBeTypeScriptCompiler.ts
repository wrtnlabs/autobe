import { IAutoBeTypeScriptCompilerProps } from "./IAutoBeTypeScriptCompilerProps";
import { IAutoBeTypeScriptCompilerResult } from "./IAutoBeTypeScriptCompilerResult";

/**
 * Interface for the official TypeScript compiler used for final code validation
 * and quality assurance.
 *
 * This compiler provides the ultimate validation layer that ensures all
 * generated code meets production standards and integrates seamlessly with the
 * TypeScript ecosystem. While the AST-based approach eliminates most potential
 * errors before code generation, the TypeScript compiler serves as the final
 * quality gate for perfect integration verification throughout the vibe coding
 * pipeline.
 *
 * The compiler validates framework integration with NestJS APIs, type system
 * integrity for complex relationships, dependency resolution across modules,
 * and build system compatibility with standard toolchains. It enables the
 * critical feedback loops necessary for AI self-correction when implementation
 * or test code contains compilation errors requiring iterative refinement.
 *
 * This validation is essential for maintaining the reliability of the automated
 * development process and ensuring that generated applications are immediately
 * deployable without manual debugging or correction cycles.
 *
 * @author Samchon
 */
export interface IAutoBeTypeScriptCompiler {
  /**
   * Compiles TypeScript code and validates integration with the application
   * ecosystem.
   *
   * Performs comprehensive TypeScript compilation including syntax validation,
   * type checking, framework API compliance verification, and dependency
   * resolution analysis. The compilation process ensures that generated code
   * meets production standards and integrates properly with NestJS frameworks,
   * Prisma client APIs, and other external dependencies.
   *
   * The compiler provides detailed feedback for compilation failures, enabling
   * AI agents to understand specific issues and implement targeted corrections.
   * This feedback mechanism is crucial for the Test and Realize agents that
   * generate implementation code requiring iterative refinement through
   * compilation error analysis and resolution.
   *
   * @param props Compilation configuration including source files, compiler
   *   options, target framework specifications, and validation requirements
   * @returns Promise resolving to compilation results including success status,
   *   generated outputs, or detailed error information for AI feedback
   */
  compile(
    props: IAutoBeTypeScriptCompilerProps,
  ): Promise<IAutoBeTypeScriptCompilerResult>;
}
