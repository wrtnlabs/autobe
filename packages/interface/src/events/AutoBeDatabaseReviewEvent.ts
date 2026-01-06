import { AutoBeDatabase } from "../database/AutoBeDatabase";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired when the Database agent reviews and validates a single table
 * model during the database design process.
 *
 * This event occurs when the Database agent has completed a comprehensive
 * review of a single database table model, validating it against best
 * practices, business requirements, and technical constraints. The review
 * process ensures that the table maintains data integrity, follows
 * normalization principles, and optimizes for performance while aligning with
 * business logic.
 *
 * The review includes validation of normalization compliance, relationship
 * integrity, indexing strategies, naming conventions, and temporal field
 * handling. Based on the review findings, the agent provides a corrected
 * model (content) if modifications are needed, or null if the table passes
 * all validation checks.
 *
 * @author Samchon
 */
export interface AutoBeDatabaseReviewEvent
  extends
    AutoBeEventBase<"databaseReview">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Namespace of the business domain containing the reviewed table.
   *
   * Identifies which business domain (schema file) this reviewed table belongs
   * to, enabling proper organization and aggregation of review results by
   * domain.
   */
  namespace: string;

  /**
   * Name of the specific table model being reviewed.
   *
   * Identifies the exact table that was reviewed within the namespace,
   * enabling precise tracking of which tables have been validated and which
   * modifications (if any) were applied.
   */
  modelName: string;

  /**
   * Comprehensive review analysis of the single table model.
   *
   * Contains the AI agent's detailed evaluation of the table design,
   * including validation of normalization compliance, relationship integrity,
   * index optimization, and business requirement alignment. The review
   * identifies potential issues and confirms adherence to best practices for
   * this specific table.
   *
   * **Review Dimensions:**
   *
   * - **Normalization Validation**: Confirms 3NF compliance and proper data
   *   structure
   * - **Relationship Integrity**: Validates foreign key references and
   *   cardinality
   * - **Performance Optimization**: Reviews indexing strategy and query patterns
   * - **Business Logic Alignment**: Ensures table supports all use cases
   * - **Naming Conventions**: Verifies consistent naming patterns
   * - **Data Type Consistency**: Confirms appropriate field types
   * - **Temporal Field Handling**: Validates audit trail implementation
   *
   * **Example:**
   *
   *     "After reviewing the table 'shopping_orders':
   *     1. Table properly implements UUID primary key
   *     2. Foreign key relationships correctly reference existing models
   *     3. Composite indexes optimize for common query patterns
   *     4. Temporal fields (created_at, updated_at, deleted_at) are present
   *     The table follows all best practices and is ready for implementation."
   */
  review: string;

  /**
   * Strategic database design plan that guided the table creation.
   *
   * Contains the original planning document that outlines the database
   * architecture strategy for this specific table, including structure,
   * relationships, normalization approach, and business requirement mapping.
   * This plan serves as the blueprint for validating the implemented table
   * model.
   *
   * **Planning Components:**
   *
   * - **Business Requirements**: Mapping of business needs to table structure
   * - **Table Design**: Entity definition and attribute specifications
   * - **Relationship Strategy**: Cardinality and referential integrity planning
   * - **Normalization Approach**: Application of 1NF, 2NF, 3NF principles
   * - **Performance Considerations**: Index strategy and query optimization
   * - **Snapshot Architecture**: Temporal data handling and audit requirements
   * - **Materialized Views**: Denormalization strategy if applicable
   *
   * **Example:**
   *
   *     "Database Design Strategy for 'shopping_orders':
   *
   *     Business Requirements:
   *     - Track customer purchase orders with complete order information
   *     - Support order status workflow and payment tracking
   *     - Enable historical order analysis and reporting
   *
   *     Design Approach:
   *     - Normalize order data to 3NF for data integrity
   *     - Implement temporal fields for audit trail
   *     - Create composite indexes for customer and date queries
   *     - Foreign keys to shopping_customers and shopping_payments"
   */
  plan: string;

  /**
   * Modified table model based on review feedback, or null if no changes needed.
   *
   * Contains the corrected table definition if the review identified issues
   * requiring modification. If the table passes all validation checks, this
   * field is null. When present, this model represents a complete table
   * definition with all fields, relationships, indexes, and documentation that
   * will replace the original model in the final schema.
   *
   * **Model Requirements (when not null):**
   *
   * - **Complete Model**: Must be a complete model definition, not partial
   * - **Same Table**: Must be the same table that was reviewed (same name)
   * - **AST Compliance**: Follows AutoBeDatabase.IModel interface structure
   * - **Relationship Integrity**: All foreign keys reference valid models
   * - **Index Optimization**: Strategic indexes without redundancy
   * - **Documentation**: Comprehensive English descriptions
   *
   * **Notes:**
   *
   * - If null, the original model remains unchanged in the schema
   * - If not null, this model completely replaces the original model
   * - All modifications must resolve issues identified in the review
   */
  content: AutoBeDatabase.IModel | null;

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
