import { AutoBeDatabaseSchemaDefinition } from "../histories/contents/AutoBeDatabaseSchemaDefinition";
import { AutoBeAcquisitionEventBase } from "./base/AutoBeAcquisitionEventBase";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired when the Database agent reviews and validates a single target
 * table model during the database schema design process.
 *
 * The review validates the target table against best practices, business
 * requirements, and technical constraints — covering normalization compliance,
 * relationship integrity, indexing strategies, naming conventions, and temporal
 * field handling.
 *
 * Based on the findings the agent provides a corrected model in {@link content}
 * (with optional {@link AutoBeDatabaseSchemaDefinition.newDesigns} for newly
 * required child tables), or null if the model passes validation.
 *
 * @author Samchon
 */
export interface AutoBeDatabaseSchemaReviewEvent
  extends
    AutoBeEventBase<"databaseSchemaReview">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase,
    AutoBeAcquisitionEventBase<
      | "analysisSections"
      | "databaseSchemas"
      | "previousAnalysisSections"
      | "previousDatabaseSchemas"
    > {
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
   * Identifies the exact table that was reviewed within the namespace, enabling
   * precise tracking of which tables have been validated and which
   * modifications (if any) were applied.
   */
  modelName: string;

  /**
   * Comprehensive review analysis of the target table and its child table
   * models.
   *
   * Contains the AI agent's detailed evaluation of the target table and any
   * child tables, including validation of normalization compliance (with
   * emphasis on 1NF enforcement through child table decomposition),
   * relationship integrity, index optimization, and business requirement
   * alignment. The review identifies potential issues and confirms adherence to
   * best practices.
   *
   * **Review Dimensions:**
   *
   * - **1NF Compliance**: Validates that repeating groups and non-atomic values
   *   are properly decomposed into child tables
   * - **Normalization Validation**: Confirms 3NF compliance and proper data
   *   structure
   * - **Relationship Integrity**: Validates foreign key references and
   *   cardinality
   * - **Performance Optimization**: Reviews indexing strategy and query patterns
   * - **Business Logic Alignment**: Ensures tables support all use cases
   * - **Naming Conventions**: Verifies consistent naming patterns, including
   *   child table prefix rules
   * - **Data Type Consistency**: Confirms appropriate field types
   * - **Temporal Field Handling**: Validates audit trail implementation
   *
   * **Example:**
   *
   *     "After reviewing the target table 'shopping_orders' and its child
   *     tables 'shopping_order_items' and 'shopping_order_payments':
   *     1. Target table properly implements UUID primary key
   *     2. Child tables correctly decompose order items and payments (1NF)
   *     3. Foreign key relationships correctly reference existing models
   *     4. Composite indexes optimize for common query patterns
   *     5. Temporal fields (created_at, updated_at, deleted_at) are present
   *     All tables follow best practices and are ready for implementation."
   */
  review: string;

  /**
   * Strategic database design plan that guided the target table and child table
   * creation.
   *
   * Contains the original planning document that outlines the database
   * architecture strategy for the target table and any child tables, including
   * structure, relationships, normalization approach (with 1NF child table
   * decomposition), and business requirement mapping. This plan serves as the
   * blueprint for validating the implemented models.
   *
   * **Planning Components:**
   *
   * - **Business Requirements**: Mapping of business needs to table structures
   * - **Table Design**: Target table and child table entity definitions
   * - **1NF Decomposition**: Identification of repeating groups or non-atomic
   *   values that require child tables
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
   *     1NF Decomposition:
   *     - shopping_order_items: Separate table for line items (repeating group)
   *     - shopping_order_payments: Separate table for payment records
   *
   *     Design Approach:
   *     - Normalize order data to 3NF for data integrity
   *     - Implement temporal fields for audit trail
   *     - Create composite indexes for customer and date queries
   *     - Foreign keys to shopping_customers and shopping_payments"
   */
  plan: string;

  /**
   * Corrected schema definition based on review feedback, or null if no changes
   * are needed.
   *
   * When not null, carries exactly one corrected model for the reviewed target
   * table ({@link modelName}) so that the AI output stays within the LLM's
   * maximum output token limit. If the review determines that additional child
   * tables are required, they are declared in
   * {@link AutoBeDatabaseSchemaDefinition.newDesigns} as lightweight name +
   * description pairs and will be generated by subsequent pipeline calls.
   *
   * If null, the original model remains unchanged in the schema. If not null,
   * the corrected model replaces the original, and any `newDesigns` entries are
   * fed back into the schema generation pipeline.
   */
  content: AutoBeDatabaseSchemaDefinition | null;

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
