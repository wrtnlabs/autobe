import { AutoBePrisma } from "@autobe/interface";

export interface IAutoBePrismaSchemaApplication {
  /**
   * Generates comprehensive Prisma schema files based on detailed requirements
   * analysis.
   *
   * Creates multiple organized schema files following enterprise patterns
   * including proper domain separation, relationship modeling, snapshot
   * patterns, inheritance, materialized views, and comprehensive documentation.
   * The generated schemas implement best practices for scalability,
   * maintainability, and data integrity.
   *
   * @param props Properties containing the file
   */
  makePrismaSchemaFile(props: IAutoBePrismaSchemaApplication.IProps): void;
}
export namespace IAutoBePrismaSchemaApplication {
  export interface IProps {
    /**
     * Step 1: Strategic database design analysis and planning.
     *
     * AI analyzes the target component and business requirements to formulate a
     * comprehensive database design strategy. This planning phase is crucial
     * for creating well-structured, normalized schemas that align with business
     * objectives. The AI must define table structures, relationships, indexing
     * strategies, and data integrity constraints before proceeding to schema
     * implementation.
     *
     * **Key Considerations:**
     *
     * - **Assignment Validation**: Extract targetComponent.tables as the complete
     *   specification
     * - **Table Count**: Must create exactly targetComponent.tables.length models
     * - **Other Components**: Identify already-created tables for foreign key
     *   references only
     * - **Normalization**: Strict adherence to 1NF, 2NF, 3NF principles
     * - **Snapshot Architecture**: Design for historical data preservation and
     *   audit trails
     * - **Junction Tables**: Plan M:N relationships with proper naming
     *   ({table1}_{table2})
     * - **Materialized Views**: Identify needs for mv_ prefixed denormalized
     *   tables
     *
     * Workflow: Component analysis → Strategic planning → Design rationale
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
     * **Review Dimensions:**
     *
     * - **Requirement Coverage**: Verify all targetComponent.tables are planned
     * - **Normalization Validation**: Confirm 3NF compliance strategy
     * - **Relationship Integrity**: Validate foreign key references to existing tables
     * - **Performance Considerations**: Review index strategy and query patterns
     * - **Snapshot Architecture**: Ensure proper temporal data handling
     * - **Materialized View Strategy**: Validate denormalization approach
     * - **Naming Consistency**: Verify adherence to conventions
     * - **Business Logic Alignment**: Confirm design supports all use cases
     *
     * Workflow: Plan analysis → Issue identification → Design validation
     */
    review: string;

    /**
     * Step 3: Production-ready Prisma schema models.
     *
     * AI generates the complete Prisma schema models based on the strategic plan.
     * This must be a structured Abstract Syntax Tree (AST) representation using
     * the AutoBePrisma.IModel interface that implements all planned tables,
     * relationships, and constraints. The models should follow Prisma conventions
     * while incorporating enterprise patterns like snapshot tables and
     * materialized views.
     *
     * **Implementation Requirements:**
     *
     * - **Model Array**: Each table from targetComponent.tables as IModel
     * - **Exact Table Names**: Use EXACT names from targetComponent.tables (NO CHANGES)
     * - **Primary Field**: Always UUID type with name "id"
     * - **Foreign Fields**: Proper IRelation configurations for all relationships
     * - **Plain Fields**: Business fields with correct types (no calculated fields)
     * - **Data Types**: uuid, string, int, double, datetime, boolean, uri
     * - **Relationships**: Proper relationship patterns for 1:1, 1:N, M:N
     * - **Indexes**:
     *   - UniqueIndexes: Business constraints and composite unique keys
     *   - PlainIndexes: Query optimization (no single foreign key indexes)
     *   - GinIndexes: Full-text search on string fields
     * - **Material Flag**: true only for mv_ prefixed tables
     * - **Descriptions**: Follow format with requirements mapping and business purpose
     *
     * **Quality Requirements:**
     *
     * - **Complete Coverage**: All targetComponent.tables implemented with exact names
     * - **Zero Errors**: Valid AST structure, no validation warnings
     * - **Proper Relationships**: All foreign keys reference existing tables correctly
     * - **Optimized Indexes**: Strategic indexes without redundant foreign key indexes
     * - **Full Normalization**: Strict 3NF compliance, denormalization only in mv_ tables
     * - **Enterprise Documentation**: Complete descriptions with business context
     * - **English-Only Descriptions**: All descriptions must be in English
     * - **Audit Support**: Proper snapshot patterns and temporal fields
     *   (created_at, updated_at, deleted_at)
     * - **Type Safety**: Consistent use of UUID for all keys, appropriate field types
     *
     * **Normalization Compliance:**
     *
     * - 1NF: Atomic values, no repeating groups
     * - 2NF: No partial dependencies on composite keys
     * - 3NF: No transitive dependencies
     * - **Prohibited Fields**: No pre-calculated totals, cached values, or
     *   aggregates in regular tables
     *
     * **Relationship Patterns in AST:**
     *
     * - 1:1: Foreign field with unique: true
     * - 1:N: Foreign field with unique: false
     * - M:N: Separate junction table model with composite indexes
     *
     * Workflow: Strategic plan → Direct AST implementation → Production-ready models
     *
     * This structured representation serves as the ultimate deliverable for
     * programmatic schema generation and manipulation.
     */
    models: AutoBePrisma.IModel[];
  }
}
