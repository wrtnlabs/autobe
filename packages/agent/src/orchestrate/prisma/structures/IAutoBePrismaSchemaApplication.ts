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
    thinking: string;

    /**
     * Step 2: Initial Prisma schema code implementation.
     *
     * AI generates the first working version of the Prisma schema based on the
     * strategic plan. This draft must be syntactically correct Prisma Schema
     * Language (PSL) code that implements all planned tables, relationships,
     * and constraints. The schema should follow Prisma conventions while
     * incorporating enterprise patterns like snapshot tables and materialized
     * views.
     *
     * **Implementation Requirements:**
     *
     * - **Exact Table Names**: Use EXACT names from targetComponent.tables (NO
     *   CHANGES)
     * - **Valid PSL Syntax**: Proper model blocks, field definitions, and
     *   directives
     * - **Primary Keys**: Always UUID type with `@id` directive
     * - **Foreign Keys**: UUID type following {target_model}_id naming pattern
     * - **Data Types**: uuid, string, int, double, datetime, boolean, uri (no
     *   pre-calculated fields)
     * - **Relationships**: Proper `@relation` directives for 1:1, 1:N, M:N
     *   patterns
     * - **Descriptions**: Follow format with requirements mapping and business
     *   purpose
     * - **NO Prohibited Fields**: No totals, cached values, aggregates in regular
     *   tables
     *
     * Workflow: Strategic plan → PSL implementation → Functional schema code
     */
    draft: string;

    /**
     * Step 3: Schema code review and quality assessment.
     *
     * AI performs a thorough review of the draft schema implementation,
     * examining multiple quality dimensions to ensure production readiness.
     * This review process identifies issues, suggests improvements, and
     * validates compliance with best practices.
     *
     * **Review Dimensions:**
     *
     * **Syntax & Compilation:**
     *
     * - Prisma schema syntax errors and invalid directives
     * - Model naming matches targetComponent.tables EXACTLY
     * - Field type appropriateness (uuid for keys, no calculated fields)
     * - Relationship definition correctness (`@relation` syntax)
     *
     * **Database Design Quality:**
     *
     * - **Normalization Compliance**:
     *
     *   - 1NF: Atomic values, no repeating groups
     *   - 2NF: No partial dependencies on composite keys
     *   - 3NF: No transitive dependencies
     * - **Prohibited Fields Check**: No pre-calculated totals, cached values, or
     *   aggregates in regular tables
     * - **Snapshot Pattern**: Proper implementation for audit trails
     * - **Junction Tables**: Correct naming ({table1}_{table2}) and structure
     *
     * **Index Strategy Validation:**
     *
     * - NO single foreign key indexes (Prisma auto-creates these)
     * - Composite indexes for query patterns
     * - Unique indexes for business constraints
     * - GIN indexes for full-text search fields
     *
     * **Description Quality:**
     *
     * - Models include: requirement mapping, business purpose, relationships,
     *   behaviors
     * - Fields include: requirement aspect, business meaning, normalization
     *   rationale
     *
     * Workflow: Draft schema → Systematic analysis → Specific improvements
     */
    review: string;

    /**
     * Step 4: Final production-ready Prisma schema code.
     *
     * AI produces the final, polished version of the Prisma schema
     * incorporating all review feedback. This code represents the completed
     * schema implementation, ready for database migration and production
     * deployment. All identified issues must be resolved, and the schema must
     * meet enterprise-grade quality standards.
     *
     * **Final Schema Characteristics:**
     *
     * - **Complete Coverage**: All targetComponent.tables implemented with exact
     *   names
     * - **Zero Errors**: Valid PSL syntax, no compilation warnings
     * - **Proper Relationships**: All foreign keys reference existing tables
     *   correctly
     * - **Optimized Indexes**: Strategic indexes without redundant foreign key
     *   indexes
     * - **Full Normalization**: Strict 3NF compliance, denormalization only in
     *   mv_ tables
     * - **Enterprise Documentation**: Complete descriptions with business context
     * - **Audit Support**: Proper snapshot patterns and temporal fields
     *   (created_at, updated_at, deleted_at)
     * - **Type Safety**: Consistent use of UUID for all keys, appropriate field
     *   types
     *
     * Workflow: Review feedback → Schema refinement → Production-ready PSL code
     */
    final: string;

    /**
     * Step 5: Structured AST representation of the Prisma schema models.
     *
     * AI transforms the final Prisma schema code into a structured Abstract
     * Syntax Tree (AST) representation using the AutoBePrisma.IModel interface.
     * This involves critical reinterpretation and reclassification of the final
     * code to conform to AST constraints.
     *
     * **CRITICAL: Reinterpretation & Post-Processing Required**
     *
     * The AI-generated final code may not directly map to valid AST structures
     * due to:
     *
     * - Complex Prisma directives that need decomposition
     * - Field attributes that require reclassification
     * - Implicit relationships that need explicit AST representation
     * - Schema-level constructs that must be distributed to models
     *
     * **Required Post-Processing Steps:**
     *
     * 1. **Field Reclassification**: Separate fields into primary, foreign, and
     *    plain categories
     * 2. **Relationship Extraction**: Convert `@relation` directives to IRelation
     *    structures
     * 3. **Index Decomposition**: Parse `@@index`, `@@unique` into appropriate
     *    index arrays
     * 4. **Type Normalization**: Map Prisma types to AST type enum values
     * 5. **Constraint Resolution**: Convert schema constraints to AST properties
     *
     * **AST Structure Requirements:**
     *
     * - **Model Array**: Each table from targetComponent.tables as IModel
     * - **Primary Field**: Always UUID type with name "id"
     * - **Foreign Fields**: Proper IRelation configurations for all relationships
     * - **Plain Fields**: Business fields with correct types (no calculated
     *   fields)
     * - **Indexes**:
     *
     *   - UniqueIndexes: Business constraints and composite unique keys
     *   - PlainIndexes: Query optimization (no single foreign key indexes)
     *   - GinIndexes: Full-text search on string fields
     * - **Material Flag**: true only for mv_ prefixed tables
     *
     * **Relationship Patterns in AST:**
     *
     * - 1:1: Foreign field with unique: true
     * - 1:N: Foreign field with unique: false
     * - M:N: Separate junction table model with composite indexes
     *
     * Workflow: Final PSL code → Reinterpretation → AST transformation →
     * Structured models
     *
     * This structured representation serves as the ultimate deliverable for
     * programmatic schema generation and manipulation.
     */
    models: AutoBePrisma.IModel[];
  }
}
