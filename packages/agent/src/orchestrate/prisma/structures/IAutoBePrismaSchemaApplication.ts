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
     * Step 2: Draft Prisma schema models based on the strategic plan.
     *
     * AI generates the initial Prisma schema models following the strategic plan.
     * This must be a structured Abstract Syntax Tree (AST) representation using
     * the AutoBePrisma.IModel interface that implements all planned tables,
     * relationships, and constraints. The draft models will be reviewed before
     * finalizing.
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
     * Workflow: Strategic plan → AST implementation → Draft models
     */
    draft: AutoBePrisma.IModel[];

    /**
     * Step 3: Review and quality assessment of the draft models.
     *
     * AI performs a thorough review of the draft models to ensure they meet
     * all requirements and best practices before finalization. This review
     * process validates the implementation, identifies potential issues,
     * and confirms the models follow all specifications.
     *
     * **Review Dimensions:**
     *
     * - **Requirement Coverage**: Verify all targetComponent.tables are implemented
     * - **Normalization Validation**: Confirm 3NF compliance in the models
     * - **Relationship Integrity**: Validate foreign key references and relationships
     * - **Performance Considerations**: Review index strategy implementation
     * - **Snapshot Architecture**: Ensure proper temporal field handling
     * - **Materialized View Strategy**: Validate denormalization in mv_ tables
     * - **Naming Consistency**: Verify adherence to conventions
     * - **Business Logic Alignment**: Confirm models support all use cases
     * - **AST Structure**: Validate proper IModel interface implementation
     *
     * Workflow: Draft analysis → Issue identification → Model validation
     */
    review: string;

    /**
     * Step 4: Model modifications based on review feedback.
     *
     * AI generates only the modified Prisma schema models based on the review
     * feedback. This contains ONLY the models that need changes, not the entire
     * schema. The modifications will be applied to the draft models to produce
     * the final production-ready schemas.
     *
     * **Modification Structure:**
     *
     * - **Partial Updates**: Include only models that require changes
     * - **Complete Model**: Each modified model must be complete (not partial fields)
     * - **Model Identity**: Use exact model names from draft for matching
     * - **Applied Changes**: Incorporate all review feedback for each model
     *
     * **Quality Requirements for Modified Models:**
     *
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
     * **Application Process:**
     *
     * The final schema is constructed by:
     * 1. Starting with the draft models
     * 2. Replacing models that exist in modifications
     * 3. Keeping unmodified models from draft as-is
     *
     * Workflow: Review feedback → Identify changes → Generate modified models only
     *
     * This approach minimizes context usage while ensuring all necessary
     * corrections are applied to produce production-ready schemas.
     */
    modifications: AutoBePrisma.IModel[];
  }
}
