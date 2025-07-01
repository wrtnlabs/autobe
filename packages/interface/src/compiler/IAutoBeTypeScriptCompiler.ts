import { IAutoBeTypeScriptCompileProps } from "./IAutoBeTypeScriptCompileProps";
import { IAutoBeTypeScriptCompileResult } from "./IAutoBeTypeScriptCompileResult";

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
    props: IAutoBeTypeScriptCompileProps,
  ): Promise<IAutoBeTypeScriptCompileResult>;

  /**
   * Retrieves the content of an external dependency file from `node_modules` by
   * its location path.
   *
   * This method provides access to specific files within the `node_modules`
   * directory, enabling the TypeScript compiler to read dependency source
   * files, type definitions, package configurations, and other resources
   * required for compilation and type checking processes.
   *
   * The location parameter should specify the relative path from the
   * `node_modules` root to the target file. This is essential for resolving
   * module imports, accessing TypeScript declaration files (`.d.ts`), reading
   * `package.json` configurations, and obtaining framework-specific resources
   * needed during the compilation process.
   *
   * @param location Relative path from node_modules to the target file (e.g.,
   *   "node_modules/@nestjs/core/package.json",
   *   "node_modules/typescript/lib/typescript.d.ts")
   * @returns Promise resolving to the file content as string, or undefined if
   *   the file does not exist or cannot be accessed
   */
  getExternal(location: string): Promise<string | undefined>;
}
