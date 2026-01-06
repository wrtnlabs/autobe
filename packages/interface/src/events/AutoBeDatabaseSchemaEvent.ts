import { AutoBeDatabase } from "../database";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired when the Database agent generates a single database table model
 * during the database design process.
 *
 * This event occurs when the Database agent has successfully designed and
 * generated ONE specific database table within a business domain. The agent
 * follows a systematic 2-step process: strategic planning (plan) and model
 * generation (model), producing a production-ready database table model that
 * maintains data integrity and business logic accuracy. The generated model
 * will be reviewed by a separate review agent.
 *
 * Each event represents the completion of a single table within a namespace.
 * Multiple events are emitted for each namespace, one per table, enabling
 * fine-grained progress tracking and parallel generation of tables within the
 * same business domain.
 *
 * @author Samchon
 */
export interface AutoBeDatabaseSchemaEvent
  extends
    AutoBeEventBase<"databaseSchema">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Strategic database design analysis and planning phase for the target table.
   *
   * Contains the AI agent's comprehensive analysis of the specific table being
   * designed and its database design strategy. The agent evaluates the table's
   * structure, relationships with other tables, normalization requirements, and
   * performance considerations to create a well-architected table model that
   * aligns with business objectives and technical best practices.
   *
   * This planning phase establishes the foundation for the single table design,
   * ensuring proper field organization, relationship mapping, and adherence to
   * database normalization principles while considering future scalability and
   * maintainability requirements.
   */
  plan: string;

  /**
   * Business domain namespace where this database table belongs.
   *
   * Identifies the logical business domain or functional area that this
   * database table is part of. The namespace follows domain-driven design
   * principles, grouping related tables together to maintain coherent schema
   * organization and clear separation of concerns across different business
   * areas.
   *
   * The namespace determines which Prisma schema file this table will be
   * written to, enabling systematic development and maintainable database
   * architecture. Each namespace typically corresponds to a major business
   * domain such as "Actors", "Sales", or "Systematic".
   */
  namespace: string;

  /**
   * Single Prisma schema model generated based on the strategic plan.
   *
   * Contains the production-ready AST representation of a single Prisma schema
   * model generated following the strategic plan. This model implements the
   * planned table structure, relationships, and constraints using the
   * AutoBeDatabase.IModel interface. The model is designed to be
   * production-ready from the start.
   *
   * The model includes the exact table name from requirements, proper UUID
   * primary field, foreign key relationships, business fields with appropriate
   * types, strategic indexes, and comprehensive English-only descriptions.
   */
  model: AutoBeDatabase.IModel;

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
