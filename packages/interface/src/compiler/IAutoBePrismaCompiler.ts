import { AutoBePrisma } from "../prisma/AutoBePrisma";
import { IAutoBePrismaValidation } from "../prisma/IAutoBePrismaValidation";
import { IAutoBePrismaCompilerProps } from "./IAutoBePrismaCompilerProps";
import { IAutoBePrismaCompilerResult } from "./IAutoBePrismaCompilerResult";

/**
 * Interface for the custom Prisma compiler that handles database schema
 * validation and generation.
 *
 * This compiler provides the foundational compilation layer that transforms
 * business requirements into validated database architectures through
 * sophisticated AST manipulation. The Prisma compiler operates exclusively on
 * {@link AutoBePrisma.IApplication} structures, eliminating error-prone
 * text-based schema authoring while ensuring perfect consistency between
 * business logic and data storage design.
 *
 * The compiler implements a comprehensive validation system that includes
 * relationship graph analysis, business logic validation, performance
 * optimization analysis, and security constraint enforcement. The deterministic
 * code generation process produces comprehensive documentation, optimal
 * indexes, and proper constraints ready for production deployment.
 *
 * @author Samchon
 */
export interface IAutoBePrismaCompiler {
  /**
   * Compiles validated Prisma application into complete database artifacts.
   *
   * Performs the complete compilation pipeline from validated
   * {@link AutoBePrisma.IApplication} through schema generation, documentation
   * creation, ERD diagram generation, and dependency file creation. This
   * comprehensive process produces all artifacts necessary for database
   * deployment and integration.
   *
   * The compilation includes validation of the AST structure, generation of
   * production-ready Prisma schema files, creation of comprehensive
   * documentation with business context, automatic ERD diagram generation
   * through prisma-markdown integration, and preparation of all supporting
   * files for seamless deployment.
   *
   * @param props Compilation configuration including the validated application
   *   and generation options
   * @returns Promise resolving to complete compilation results including
   *   success status, generated artifacts, or detailed error information
   */
  compile(
    props: IAutoBePrismaCompilerProps,
  ): Promise<IAutoBePrismaCompilerResult>;

  /**
   * Validates Prisma application AST structure for correctness and best
   * practices.
   *
   * Performs comprehensive validation of the {@link AutoBePrisma.IApplication}
   * structure including relationship graph analysis to detect circular
   * dependencies, business logic validation for constraint compliance,
   * performance optimization analysis for query patterns, and security
   * constraint enforcement for data access patterns.
   *
   * The validation process ensures that the database design is semantically
   * correct, follows established best practices, and will function correctly in
   * production environments. When validation errors occur, detailed feedback is
   * provided to enable AI self-correction through the iterative improvement
   * feedback loop.
   *
   * @param app Prisma application AST structure to validate
   * @returns Promise resolving to validation results including success status
   *   and detailed error information for correction guidance
   */
  validate(app: AutoBePrisma.IApplication): Promise<IAutoBePrismaValidation>;

  /**
   * Generates Prisma schema files from validated application AST structure.
   *
   * Transforms the validated {@link AutoBePrisma.IApplication} AST into
   * production-ready Prisma schema files through deterministic code generation.
   * The generated schemas include comprehensive documentation for each entity
   * and attribute, optimal index configurations, proper constraint definitions,
   * and business context explanations derived from the AST structure.
   *
   * The schema files are organized by business domains following domain-driven
   * design principles, with each file focusing on related models within the
   * same functional area. The generated schemas are immediately ready for
   * Prisma deployment and database migration processes.
   *
   * @param app Validated Prisma application AST structure
   * @returns Promise resolving to key-value pairs mapping schema filenames to
   *   generated Prisma schema content
   */
  write(app: AutoBePrisma.IApplication): Promise<Record<string, string>>;
}
