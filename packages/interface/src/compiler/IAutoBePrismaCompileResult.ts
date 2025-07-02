/**
 * Result of compiling and processing Prisma schema files through the custom
 * Prisma Compiler.
 *
 * This union type represents all possible outcomes when the Prisma Compiler
 * transforms validated {@link AutoBePrisma.IApplication} AST structures into
 * production-ready artifacts. The compilation process includes schema
 * validation, documentation generation, ERD diagram creation, and dependency
 * resolution.
 *
 * The compiler should always produce successful results since it operates on
 * pre-validated AST structures. Failure cases typically indicate issues with
 * the compilation environment or unexpected edge cases that should be reported
 * as bugs.
 *
 * @author Samchon
 */
export type IAutoBePrismaCompileResult =
  | IAutoBePrismaCompileResult.ISuccess
  | IAutoBePrismaCompileResult.IFailure
  | IAutoBePrismaCompileResult.IException;

export namespace IAutoBePrismaCompileResult {
  /**
   * Successful compilation result containing all generated artifacts.
   *
   * Represents the ideal outcome where the Prisma schema compilation completed
   * without errors and produced all expected outputs including documentation,
   * diagrams, and dependency files ready for deployment.
   */
  export interface ISuccess {
    /** Discriminator indicating successful compilation. */
    type: "success";

    /**
     * Generated comprehensive documentation for the database schema.
     *
     * Contains detailed markdown documentation automatically synthesized from
     * AST descriptions, including business context, technical constraints, and
     * operational characteristics for every model and field. This documentation
     * becomes an integral part of the codebase for ongoing maintenance.
     */
    document: string;

    /**
     * Generated Entity Relationship Diagrams as key-value pairs.
     *
     * Each key represents the diagram filename and each value contains the
     * diagram content (typically in Mermaid or other visualization format).
     * These diagrams are automatically generated through integration with
     * [`prisma-markdown`](https://github.com/samchon/prisma-markdown|prisma-markdown)
     * and provide visual documentation that stays synchronized with
     * implementation.
     */
    diagrams: Record<string, string>;

    /**
     * Final Prisma schema files optimized for production deployment.
     *
     * Contains the definitive schema files with all optimizations applied,
     * including automatically generated indexes, constraints, and performance
     * enhancements. These schemas are ready for immediate deployment to the
     * target database environment.
     */
    schemas: Record<string, string>;

    /**
     * Generated Node.js dependency files and configurations.
     *
     * Includes package.json configurations, TypeScript definitions, and other
     * Node.js ecosystem files required for proper integration with the
     * generated Prisma schemas. Ensures seamless compatibility with existing
     * development and deployment workflows.
     */
    nodeModules: Record<string, string>;
  }

  /**
   * Compilation failure with detailed error information.
   *
   * Represents cases where the compilation process encountered logical or
   * semantic errors that prevented successful generation of artifacts. This
   * should be rare since compilation operates on pre-validated AST structures.
   */
  export interface IFailure {
    /** Discriminator indicating compilation failure. */
    type: "failure";

    /**
     * Detailed explanation of why the compilation failed.
     *
     * Provides specific information about the error condition, including
     * context about which part of the compilation process failed and potential
     * remediation steps. This information is crucial for debugging and
     * improving the compilation process.
     */
    reason: string;
  }

  /**
   * Unexpected exception during compilation process.
   *
   * Represents cases where the compilation process encountered an unexpected
   * runtime error or system exception. These cases indicate potential bugs in
   * the compiler implementation that should be investigated and reported.
   */
  export interface IException {
    /** Discriminator indicating compilation exception. */
    type: "exception";

    /**
     * The raw error or exception that occurred during compilation.
     *
     * Contains the original error object or exception details for debugging
     * purposes. This information helps developers identify the root cause of
     * unexpected compilation failures and improve system reliability.
     */
    error: unknown;
  }
}
