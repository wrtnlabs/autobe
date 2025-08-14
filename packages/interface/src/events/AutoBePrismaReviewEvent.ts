import { AutoBePrisma } from "../prisma/AutoBePrisma";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

/**
 * Event fired when the Prisma agent reviews and validates schema modifications
 * during the database design process.
 *
 * This event occurs when the Prisma agent has completed a comprehensive review
 * of proposed database schema changes, validating them against best practices,
 * business requirements, and technical constraints. The review process ensures
 * that all modifications maintain data integrity, follow normalization
 * principles, and optimize for performance while aligning with business logic.
 *
 * The review includes validation of normalization compliance, relationship
 * integrity, indexing strategies, naming conventions, and temporal field
 * handling. Based on the review findings, the agent provides targeted
 * modifications to address any identified issues while preserving the overall
 * schema architecture.
 *
 * @author Samchon
 */
export interface AutoBePrismaReviewEvent
  extends AutoBeEventBase<"prismaReview">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
  /** Name of the Prisma schema file being reviewed. */
  filename: string;

  /**
   * Comprehensive review analysis of the proposed schema modifications.
   *
   * Contains the AI agent's detailed evaluation of the schema changes,
   * including validation of normalization compliance, relationship integrity,
   * index optimization, and business requirement alignment. The review
   * identifies potential issues and confirms adherence to best practices.
   *
   * **Review Dimensions:**
   *
   * - **Normalization Validation**: Confirms 3NF compliance and proper data
   *   structure
   * - **Relationship Integrity**: Validates foreign key references and
   *   cardinality
   * - **Performance Optimization**: Reviews indexing strategy and query patterns
   * - **Business Logic Alignment**: Ensures schema supports all use cases
   * - **Naming Conventions**: Verifies consistent naming patterns
   * - **Data Type Consistency**: Confirms appropriate field types
   * - **Temporal Field Handling**: Validates audit trail implementation
   *
   * **Example:**
   *
   *     "After reviewing the schema modifications:
   *     1. All tables properly implement UUID primary keys
   *     2. Foreign key relationships correctly reference existing models
   *     3. Composite indexes optimize for common query patterns
   *     4. Snapshot tables include proper temporal fields
   *     5. Materialized views (mv_) contain appropriate denormalization
   *     The schema follows all best practices and is ready for implementation."
   */
  review: string;

  /**
   * Strategic database design plan that guided the schema creation.
   *
   * Contains the original planning document that outlines the database
   * architecture strategy, including table structures, relationships,
   * normalization approach, and business requirement mapping. This plan serves
   * as the blueprint for validating the implemented schema.
   *
   * **Planning Components:**
   *
   * - **Business Requirements**: Mapping of business needs to database structures
   * - **Table Design**: Entity definitions and attribute specifications
   * - **Relationship Strategy**: Cardinality and referential integrity planning
   * - **Normalization Approach**: Application of 1NF, 2NF, 3NF principles
   * - **Performance Considerations**: Index strategy and query optimization
   * - **Snapshot Architecture**: Temporal data handling and audit requirements
   * - **Materialized Views**: Denormalization strategy for performance
   *
   * **Example:**
   *
   *     "Database Design Strategy:
   *     Component: Sales Domain
   *     Tables: shopping_sales, shopping_sale_snapshots, shopping_sale_units
   *
   *     Design Approach:
   *     - Normalize product catalog to 3NF for data integrity
   *     - Implement snapshot pattern for price history tracking
   *     - Create composite indexes for product search queries
   *     - Use materialized views for sales analytics dashboards"
   */
  plan: string;

  /**
   * Array of Prisma models that have been modified based on review feedback.
   *
   * Contains ONLY the models that required changes, not the entire schema. Each
   * model represents a complete table definition with all fields,
   * relationships, indexes, and documentation. These modifications will be
   * applied to the draft schema to produce the final implementation.
   *
   * **Model Requirements:**
   *
   * - **Complete Models**: Each entry must be a complete model definition
   * - **Targeted Changes**: Only includes models that need modifications
   * - **AST Compliance**: Follows AutoBePrisma.IModel interface structure
   * - **Relationship Integrity**: All foreign keys reference valid models
   * - **Index Optimization**: Strategic indexes without redundancy
   * - **Documentation**: Comprehensive English descriptions
   *
   * **Notes:**
   *
   * - Models not included in this array remain unchanged from the draft
   * - The final schema merges these modifications with the original draft
   * - All modifications must resolve issues identified in the review
   */
  modifications: AutoBePrisma.IModel[];

  /**
   * Iteration number of the requirements analysis this review was performed
   * for.
   *
   * Indicates which version of the requirements analysis this schema review
   * reflects. This step number ensures that the database review and
   * modifications are aligned with the current requirements and helps track the
   * evolution of database architecture as business requirements change.
   *
   * The step value enables proper synchronization between database review
   * activities and the underlying requirements, ensuring that the schema
   * structure remains relevant to the current project scope and business
   * objectives.
   */
  step: number;
}
