import { AutoBePrisma } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Prisma agent generates a complete schema file for a
 * specific business domain during the database design process.
 *
 * This event occurs when the Prisma agent has successfully designed and
 * validated all database tables for a particular business domain (e.g., Sales,
 * Orders, Users). The agent follows a systematic 4-step process: strategic
 * planning (plan), draft model generation (draft), design review (review), and
 * final schema file generation (file), ensuring production-ready database
 * schemas that maintain data integrity and business logic accuracy.
 *
 * Each schema file represents a cohesive unit of database design focused on a
 * specific business area, following domain-driven design principles. The
 * progressive completion of schema files provides real-time visibility into the
 * database architecture development, enabling stakeholders to track progress
 * and validate domain-specific data models incrementally.
 *
 * @author Samchon
 */
export interface AutoBePrismaSchemasEvent
  extends AutoBeEventBase<"prismaSchemas"> {
  /**
   * Step 1: Strategic database design analysis and planning phase.
   *
   * Contains the AI agent's comprehensive analysis of the target business
   * domain and its database design strategy. The agent evaluates the required
   * tables, their relationships, normalization requirements, and performance
   * considerations to create a well-architected database schema that aligns
   * with business objectives and technical best practices.
   *
   * This planning phase establishes the foundation for the entire schema
   * design, ensuring proper table organization, relationship mapping, and
   * adherence to database normalization principles while considering future
   * scalability and maintainability requirements.
   */
  plan: string;

  /**
   * Step 2: Draft Prisma schema models based on the strategic plan.
   *
   * Contains the initial AST representation of Prisma schema models generated
   * following the strategic plan. These draft models implement all planned
   * tables, relationships, and constraints using the AutoBePrisma.IModel
   * interface. The draft serves as the basis for review before finalization.
   *
   * The draft models include exact table names from requirements, proper UUID
   * primary fields, foreign key relationships, business fields with appropriate
   * types, strategic indexes, and comprehensive English-only descriptions.
   */
  draft: AutoBePrisma.IModel[];

  /**
   * Step 3: Review and quality assessment of the draft models.
   *
   * AI performs a thorough review of the draft models to ensure they meet
   * all requirements and best practices before finalization. This review
   * process validates the implementation, identifies potential issues,
   * and confirms the models follow all specifications.
   *
   * The review covers requirement coverage, normalization validation,
   * relationship integrity, performance considerations, snapshot architecture,
   * materialized view strategy, naming consistency, business logic alignment,
   * and AST structure validation.
   */
  review: string;

  /**
   * Step 4: Model modifications based on review feedback.
   *
   * Contains only the Prisma schema models that need changes based on the
   * review feedback. This partial list includes complete model definitions
   * for tables that require modifications, not the entire schema. The final
   * schema is constructed by applying these modifications to the draft models.
   *
   * Each model in this array represents a complete replacement for the
   * corresponding model in the draft, incorporating all necessary corrections
   * and improvements identified during the review process.
   */
  modifications: AutoBePrisma.IModel[];

  /**
   * Step 5: Generated Prisma schema file information for a specific business domain.
   *
   * This field contains the complete schema file data including the filename,
   * namespace, and the production-ready Prisma schema models. The AI agent has
   * analyzed the requirements, designed the tables, reviewed the draft, and
   * produced final models that include all necessary relationships, indexes,
   * and constraints.
   *
   * The generated file follows the naming convention `schema-{number}-{domain}.prisma`
   * where the number indicates dependency order and the domain represents the
   * business area. The final models within the file follow Prisma conventions
   * while incorporating enterprise patterns like snapshot tables and materialized
   * views.
   *
   * Each model in the file.models array represents a table in the database with
   * proper field definitions, relationships, indexes, and comprehensive documentation,
   * refined through the review process to ensure production readiness.
   */
  file: AutoBePrisma.IFile;

  /**
   * Number of schema files that have been completed so far.
   *
   * Indicates the current progress in the schema design process, showing how
   * many business domain schema files have been successfully created and
   * validated. This progress tracking helps stakeholders understand the
   * advancement of database design and estimate completion timing.
   */
  completed: number;

  /**
   * Total number of schema files that need to be created.
   *
   * Represents the complete scope of schema files required for the database
   * design, corresponding to the number of business domains identified during
   * the component organization phase. This total count provides context for the
   * completion progress and helps stakeholders understand the overall
   * complexity and scope of the database architecture.
   */
  total: number;

  /**
   * Iteration number of the requirements analysis this schema was generated
   * for.
   *
   * Tracks which version of the business requirements this database schema
   * reflects, ensuring alignment between the evolving requirements and the
   * generated data models. As requirements change through iterations, this step
   * number helps maintain traceability and version consistency across the
   * database architecture development process.
   */
  step: number;
}
