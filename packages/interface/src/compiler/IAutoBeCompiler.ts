import { IAutoBeInterfaceCompiler } from "./IAutoBeInterfaceCompiler";
import { IAutoBePrismaCompiler } from "./IAutoBePrismaCompiler";
import { IAutoBeTestCompiler } from "./IAutoBeTestCompiler";
import { IAutoBeTypeScriptCompiler } from "./IAutoBeTypeScriptCompiler";

/**
 * Interface representing the comprehensive compilation infrastructure for the
 * vibe coding pipeline.
 *
 * This interface defines the three-tier compiler system that transforms AST
 * structures into production-ready code across all development phases. The
 * compilation infrastructure ensures 100% syntactic correctness and semantic
 * integrity throughout the automated development workflow from database design
 * through final implementation.
 *
 * Each compiler component operates on validated AST data to prevent errors at
 * the structural level, enabling the revolutionary "structure first, validate
 * continuously, generate deterministically" approach that ensures generated
 * applications work correctly on the first attempt without manual debugging
 * cycles.
 *
 * The compilation system supports both embedded and distributed deployment
 * models, allowing separation into dedicated worker processes for
 * high-performance scenarios with multiple concurrent users.
 *
 * @author Samchon
 */
export interface IAutoBeCompiler {
  /**
   * Custom Prisma compiler for database schema validation and generation.
   *
   * Provides the foundational compilation layer that transforms business
   * requirements into validated database architectures through sophisticated
   * AST manipulation. The Prisma compiler operates exclusively on
   * {@link AutoBePrisma.IApplication} structures, eliminating error-prone
   * text-based schema authoring while ensuring perfect consistency between
   * business logic and data storage design.
   *
   * Features include multi-layered semantic validation, relationship graph
   * analysis, business logic validation, performance optimization analysis, and
   * deterministic code generation that produces comprehensive documentation,
   * optimal indexes, and proper constraints ready for production deployment.
   */
  prisma: IAutoBePrismaCompiler;

  /**
   * Custom Interface compiler for API specification and NestJS application
   * generation.
   *
   * Transforms validated {@link AutoBeOpenApi.IDocument} AST structures into
   * comprehensive NestJS projects through a sophisticated multi-stage
   * transformation pipeline. The Interface compiler bridges the gap between
   * database design and application implementation, ensuring perfect alignment
   * with business requirements and database schemas.
   *
   * The compiler includes revolutionary enhancements such as keyworded
   * parameter optimization for AI consumption, comprehensive JSDoc
   * documentation derived from AST descriptions, intelligent test scaffolds,
   * and end-to-end type safety assurance throughout the entire application
   * stack.
   */
  interface: IAutoBeInterfaceCompiler;

  /**
   * Official TypeScript compiler for final code validation and quality
   * assurance.
   *
   * Provides the ultimate validation layer that ensures all generated code
   * meets production standards and integrates seamlessly with the TypeScript
   * ecosystem. While the AST-based approach eliminates most potential errors
   * before code generation, the TypeScript compiler serves as the final quality
   * gate for perfect integration verification.
   *
   * The compiler validates framework integration, type system integrity,
   * dependency resolution, and build system compatibility. It enables the
   * feedback loops necessary for AI self-correction when implementation or test
   * code contains compilation errors that need iterative refinement.
   */
  typescript: IAutoBeTypeScriptCompiler;

  test: IAutoBeTestCompiler;
}
