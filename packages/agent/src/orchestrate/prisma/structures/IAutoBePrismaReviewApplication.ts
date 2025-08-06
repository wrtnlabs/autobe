import { AutoBePrisma } from "@autobe/interface";

export interface IAutoBePrismaReviewApplication {
  /**
   * Reviews and validates Prisma schema modifications to ensure compliance with
   * database design best practices and business requirements.
   *
   * Performs comprehensive validation of proposed schema changes including
   * normalization compliance, relationship integrity, performance optimization,
   * and business logic alignment. The review process ensures all modifications
   * maintain data consistency and follow enterprise-level database standards.
   */
  reviewSchemaFile(props: IAutoBePrismaReviewApplication.IProps): void;
}
export namespace IAutoBePrismaReviewApplication {
  export interface IProps {
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
     * - **Performance Optimization**: Reviews indexing strategy and query
     *   patterns
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
     * normalization approach, and business requirement mapping. This plan
     * serves as the blueprint for validating the implemented schema.
     *
     * **Planning Components:**
     *
     * - **Business Requirements**: Mapping of business needs to database
     *   structures
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
     * Contains ONLY the models that required changes, not the entire schema.
     * Each model represents a complete table definition with all fields,
     * relationships, indexes, and documentation. These modifications will be
     * applied to the models to produce the final implementation.
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
     * - Models not included in this array remain unchanged from the models
     * - The final schema merges these modifications with the original models
     * - All modifications must resolve issues identified in the review
     */
    modifications: AutoBePrisma.IModel[];
  }
}
