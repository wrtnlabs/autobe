import { AutoBePrisma } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

/**
 * Event fired when the Prisma agent generates a complete schema file for a
 * specific business domain during the database design process.
 *
 * This event occurs when the Prisma agent has successfully designed and
 * generated all database tables for a particular business domain (e.g., Sales,
 * Orders, Users). The agent follows a systematic 2-step process: strategic
 * planning (plan) and model generation (models), producing production-ready
 * database schemas that maintain data integrity and business logic accuracy.
 * The generated models will be reviewed by a separate review agent.
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
  extends AutoBeEventBase<"prismaSchemas">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
  /**
   * Strategic database design analysis and planning phase.
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
   * Prisma schema models generated based on the strategic plan.
   *
   * Contains the production-ready AST representation of Prisma schema models
   * generated following the strategic plan. These models implement all planned
   * tables, relationships, and constraints using the AutoBePrisma.IModel
   * interface. The models are designed to be production-ready from the start.
   *
   * The models include exact table names from requirements, proper UUID primary
   * fields, foreign key relationships, business fields with appropriate types,
   * strategic indexes, and comprehensive English-only descriptions.
   */
  models: AutoBePrisma.IModel[];

  /**
   * Generated Prisma schema file information for a specific business domain.
   *
   * This field contains the complete schema file data including the filename,
   * namespace, and the production-ready Prisma schema models. The AI agent has
   * analyzed the requirements, designed the tables, and produced models that
   * include all necessary relationships, indexes, and constraints.
   *
   * The generated file follows the naming convention
   * `schema-{number}-{domain}.prisma` where the number indicates dependency
   * order and the domain represents the business area. The final models within
   * the file follow Prisma conventions while incorporating enterprise patterns
   * like snapshot tables and materialized views.
   *
   * Each model in the file.models array represents a table in the database with
   * proper field definitions, relationships, indexes, and comprehensive
   * documentation, designed to ensure production readiness from the initial
   * generation.
   */
  file: AutoBePrisma.IFile;

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
