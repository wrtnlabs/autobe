import { tags } from "typia";

import { AutoBeDatabase } from "../database";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired when the Database agent generates database models for a target
 * table (and its child tables for 1NF compliance) during the database design
 * process.
 *
 * This event occurs when the Database agent has successfully designed and
 * generated the target table and any child tables needed to enforce the First
 * Normal Form (1NF) — decomposing repeating groups or non-atomic column values
 * into separate normalized tables. The agent follows a systematic 2-step
 * process: strategic planning (plan) and model generation (models), producing
 * production-ready database table models that maintain data integrity and
 * business logic accuracy. The generated models will be reviewed by a separate
 * review agent.
 *
 * Each event represents the completion of one target table (and its children)
 * within a namespace. Multiple events are emitted for each namespace, one per
 * target table, enabling fine-grained progress tracking and parallel generation
 * of tables within the same business domain.
 *
 * @author Samchon
 */
export interface AutoBeDatabaseSchemaEvent
  extends
    AutoBeEventBase<"databaseSchema">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Strategic database design analysis and planning phase for the target table
   * and its child tables.
   *
   * Contains the AI agent's comprehensive analysis of the target table being
   * designed and its database design strategy, including identification of
   * child tables needed for First Normal Form (1NF) compliance. The agent
   * evaluates the table's structure, relationships with other tables,
   * normalization requirements, and performance considerations to create
   * well-architected table models that align with business objectives and
   * technical best practices.
   *
   * This planning phase establishes the foundation for the target table and any
   * child table designs, ensuring proper field organization, relationship
   * mapping, and adherence to database normalization principles while
   * considering future scalability and maintainability requirements.
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
   * Prisma schema models generated based on the strategic plan.
   *
   * Contains the production-ready AST representations of Prisma schema models
   * generated following the strategic plan. The array always includes the
   * target table model (mandatory), and may include child table models that
   * enforce First Normal Form (1NF) — decomposing repeating groups or
   * non-atomic column values into separate normalized tables.
   *
   * Child table names start with the singular form of the target table name as
   * a prefix (e.g., for target "shopping_orders": "shopping_order_items",
   * "shopping_order_payments"). Child table names never collide with tables
   * already assigned to other components.
   *
   * Each model includes the proper table name, UUID primary field, foreign key
   * relationships, business fields with appropriate types, strategic indexes,
   * and comprehensive English-only descriptions.
   */
  models: AutoBeDatabase.IModel[] & tags.MinItems<1>;

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
