import { AutoBePrisma } from "../prisma";
import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired when the Prisma agent generates a complete schema file for a
 * specific business domain during the database design process.
 *
 * This event occurs when the Prisma agent has successfully designed and
 * validated all database tables for a particular business domain (e.g., Sales,
 * Orders, Users). The agent follows a systematic 5-step process: strategic
 * planning, initial implementation, code review, refinement, and AST
 * transformation, ensuring production-ready database schemas that maintain data
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
   * Strategic database design analysis and planning phase.
   *
   * Contains the AI agent's comprehensive analysis of the target business domain
   * and its database design strategy. The agent evaluates the required tables,
   * their relationships, normalization requirements, and performance
   * considerations to create a well-architected database schema that aligns with
   * business objectives and technical best practices.
   *
   * This planning phase establishes the foundation for the entire schema design,
   * ensuring proper table organization, relationship mapping, and adherence to
   * database normalization principles while considering future scalability and
   * maintainability requirements.
   */
  thinking: string;

  /**
   * Initial Prisma schema code implementation.
   *
   * Contains the first working version of the Prisma Schema Language (PSL) code
   * for the target business domain. This draft implements all required tables
   * with their fields, relationships, indexes, and constraints following Prisma
   * conventions and enterprise database patterns.
   *
   * The draft serves as the foundation for iterative refinement, demonstrating
   * the AI agent's understanding of the business requirements and its ability to
   * translate them into syntactically correct database schema definitions that
   * maintain data integrity and support efficient querying patterns.
   */
  draft: string;

  /**
   * Schema code review and quality assessment.
   *
   * Provides a comprehensive analysis of the draft schema implementation,
   * identifying potential issues, areas for improvement, and validation of best
   * practices compliance. The review examines syntax correctness, normalization
   * adherence, relationship accuracy, index optimization, and documentation
   * completeness.
   *
   * This critical review phase ensures that the generated schema meets
   * enterprise-grade quality standards, maintains data integrity, supports
   * efficient query patterns, and aligns with both business requirements and
   * technical best practices before final implementation.
   */
  review: string;

  /**
   * Final production-ready Prisma schema code.
   *
   * Contains the refined and polished version of the Prisma schema that
   * incorporates all review feedback and optimizations. This production-ready
   * code has zero syntax errors, complete business entity coverage, optimized
   * indexes, comprehensive documentation, and full compliance with database
   * normalization principles.
   *
   * The final schema represents the culmination of the iterative design process,
   * ready for direct use in database migrations and production deployment. It
   * ensures consistent data modeling, maintainable architecture, and optimal
   * performance characteristics for the target business domain.
   */
  final: string;

  /**
   * Generated Prisma schema file for a specific business domain.
   *
   * This field contains the complete database schema design for one business
   * domain (e.g., Sales, Orders, Users) in a structured format. The AI agent
   * has analyzed the requirements, designed the tables, and produced a
   * production-ready schema file that includes all necessary models,
   * relationships, indexes, and constraints.
   *
   * The generated file follows the naming convention
   * `schema-{number}-{domain}.prisma` where the number indicates dependency
   * order and the domain represents the business area. For example,
   * `schema-02-actors.prisma` would contain all user-related tables like
   * customers, administrators, and citizens.
   *
   * This structured representation enables the system to generate actual Prisma
   * schema files that can be directly used for database migrations, ensuring
   * consistent and maintainable database architecture across the entire
   * application.
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
   * Iteration number of the requirements analysis this schema was generated for.
   *
   * Tracks which version of the business requirements this database schema
   * reflects, ensuring alignment between the evolving requirements and the
   * generated data models. As requirements change through iterations, this step
   * number helps maintain traceability and version consistency across the
   * database architecture development process.
   */
  step: number;
}
