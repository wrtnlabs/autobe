import { AutoBePrisma } from "@autobe/interface";
import { tags } from "typia";

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
     * Strategic database design analysis and planning.
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
     * Production-ready Prisma schema models generated based on the strategic
     * plan.
     *
     * Contains a structured Abstract Syntax Tree (AST) representation of all
     * database tables for the target component. Each model implements the
     * planned table structure, relationships, indexes, and constraints using
     * the AutoBePrisma.IModel interface. These models are designed to be
     * production-ready from the initial generation, following all best
     * practices and normalization principles.
     *
     * **Implementation Requirements:**
     *
     * - **Model Count**: Exactly matches targetComponent.tables.length (plus any
     *   junction tables)
     * - **Table Names**: EXACT names from targetComponent.tables - no
     *   modifications allowed
     * - **Primary Keys**: Always UUID type with field name "id"
     * - **Foreign Keys**: Proper IRelation configurations for all relationships
     * - **Business Fields**: Only raw data fields - no calculated or derived
     *   values
     * - **Data Types**: Limited to: uuid, string, int, double, datetime, boolean,
     *   uri
     * - **Relationships**: Correct patterns for 1:1, 1:N, and M:N relationships
     * - **Indexes**:
     *
     *   - UniqueIndexes: Business constraints and composite unique keys
     *   - PlainIndexes: Multi-column query optimization (never single FK indexes)
     *   - GinIndexes: Full-text search on appropriate string fields
     * - **Materialized Views**: Tables prefixed with "mv_" have material flag set
     *   to true
     * - **Documentation**: Comprehensive English descriptions with business
     *   context
     *
     * **Quality Standards:**
     *
     * - **Normalization**: Strict adherence to 3NF (Third Normal Form)
     * - **No Denormalization**: Except in materialized views (mv_ tables)
     * - **Referential Integrity**: All foreign keys reference valid existing
     *   tables
     * - **Temporal Fields**: Consistent created_at, updated_at, deleted_at
     *   patterns
     * - **Snapshot Support**: Proper historical data preservation where needed
     * - **Performance Ready**: Optimized index strategy for expected query
     *   patterns
     *
     * The generated models will undergo review by a separate specialized agent
     * to ensure compliance with all requirements and best practices.
     */
    models: AutoBePrisma.IModel[] & tags.MinItems<1>;
  }
}
