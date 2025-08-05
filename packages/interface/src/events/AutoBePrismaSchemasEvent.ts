import { AutoBePrisma } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Prisma agent generates a complete schema file for a
 * specific business domain during the database design process.
 *
 * This event occurs when the Prisma agent has successfully designed and
 * validated all database tables for a particular business domain (e.g., Sales,
 * Orders, Users). The agent follows a systematic 3-step process: strategic
 * planning (plan), design review (review), and final schema file generation
 * (file), ensuring production-ready database schemas that maintain data
 * integrity and business logic accuracy.
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
   * Step 2: Review and quality assessment of the database design plan.
   *
   * AI performs a thorough review of the strategic plan to ensure it meets
   * all requirements and best practices before implementation. This review
   * process validates the design decisions, identifies potential issues,
   * and confirms the approach will result in a robust schema.
   *
   * The review covers requirement coverage, normalization validation,
   * relationship integrity, performance considerations, snapshot architecture,
   * materialized view strategy, naming consistency, and business logic
   * alignment.
   */
  review: string;

  /**
   * Generated Prisma schema file information for a specific business domain.
   *
   * This field contains the complete schema file data including the filename,
   * namespace, and the production-ready Prisma schema models. The AI agent has
   * analyzed the requirements, designed the tables, and produced models that
   * include all necessary relationships, indexes, and constraints.
   *
   * The generated file follows the naming convention `schema-{number}-{domain}.prisma`
   * where the number indicates dependency order and the domain represents the
   * business area. The models within the file follow Prisma conventions while
   * incorporating enterprise patterns like snapshot tables and materialized views.
   *
   * Each model in the file.models array represents a table in the database with
   * proper field definitions, relationships, indexes, and comprehensive documentation.
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
