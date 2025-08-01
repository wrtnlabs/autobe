import { tags } from "typia";

import { IAutoBePrismaCompileResult } from "../compiler";
import { IAutoBePrismaValidation } from "../prisma";
import { AutoBeAgentHistoryBase } from "./AutoBeHistoryBase";

/**
 * History record generated when the Prisma agent analyzes the requirements
 * specification and completes the database design.
 *
 * The Prisma agent constructs data of type {@link AutoBePrisma.IApplication}
 * through AI function calling, validates it, and then generates prisma schema
 * files. This history captures the complete database design process including
 * validation results, generated schema files, and compilation outcomes.
 *
 * The database design process follows a sophisticated three-tier compiler
 * infrastructure that transforms business requirements into validated database
 * architectures through AST (Abstract Syntax Tree) manipulation, ensuring 100%
 * syntactic correctness while maintaining semantic integrity.
 *
 * @author Samchon
 */
export interface AutoBePrismaHistory extends AutoBeAgentHistoryBase<"prisma"> {
  /**
   * Validation results of the constructed {@link AutoBePrisma.IApplication}
   * data.
   *
   * Contains the outcome of validating the AST structures generated through AI
   * function calling. The Prisma agent generally creates valid
   * {@link AutoBePrisma.IApplication} data through a validation feedback
   * process, but when using very small AI models, this result might have
   * `success := false`.
   *
   * The validation includes:
   *
   * - Relationship graph analysis to detect circular dependencies
   * - Business logic validation for constraint compliance
   * - Performance optimization analysis for query patterns
   * - Security constraint enforcement for data access patterns
   */
  result: IAutoBePrismaValidation;

  /**
   * Generated Prisma schema files as key-value pairs.
   *
   * Each key represents the filename (following the pattern
   * `schema-{number}-{domain}.prisma`) and each value contains the actual
   * Prisma schema content. These files are organized by business domains
   * following domain-driven design principles.
   *
   * The schemas are generated through deterministic code generation that
   * transforms validated AST structures into production-ready Prisma schema
   * files with comprehensive documentation, optimal indexes, and proper
   * constraints.
   */
  schemas: Record<string, string>;

  /**
   * Results of compiling the generated Prisma schema files.
   *
   * Contains the compilation outcome when the generated schemas are processed
   * by the Prisma compiler. This should always compile successfully since the
   * schemas are generated from validated AST structures. If compilation fails,
   * it would be a bug in the system and should be reported as an issue.
   *
   * The compilation process includes validation of syntax, relationships, and
   * database-specific constraints to ensure the schemas will work correctly in
   * the target database environment.
   */
  compiled: IAutoBePrismaCompileResult;

  /**
   * Reason why the Prisma agent was activated through function calling.
   *
   * Explains the specific circumstances that triggered the AI chatbot to invoke
   * the Prisma agent via function calling. This could include reasons such as
   * new requirements that require database schema changes, updates to existing
   * requirements that affect data models, or initial database design requests
   * from the user conversation.
   */
  reason: string;
  /**
   * Iteration number of the requirements analysis report this database design
   * was performed for.
   *
   * Indicates which version of the requirements analysis this database design
   * reflects. If this value is lower than {@link AutoBeAnalyzeHistory.step}, it
   * means the database design has not yet been updated to reflect the latest
   * requirements and may need to be regenerated.
   *
   * A value of 0 indicates the initial database design, while higher values
   * represent subsequent revisions based on updated requirements.
   */
  step: number;

  /**
   * ISO 8601 timestamp indicating when the database design process was
   * completed.
   *
   * Marks the exact moment when the Prisma schema generation, validation, and
   * compilation process finished successfully. This timestamp is crucial for
   * tracking the development timeline and determining the currency of the
   * database design relative to other development artifacts.
   */
  completed_at: string & tags.Format<"date-time">;
}
