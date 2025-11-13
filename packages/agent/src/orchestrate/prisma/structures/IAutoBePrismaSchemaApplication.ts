import { AutoBePrisma } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";

export interface IAutoBePrismaSchemaApplication {
  /**
   * Process schema generation task or preliminary data requests.
   *
   * Generates Prisma models for the target component following normalization
   * principles and database design best practices.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBePrismaSchemaApplication.IProps): void;
}
export namespace IAutoBePrismaSchemaApplication {
  export interface IProps {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles) or final schema generation (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request: IComplete | IAutoBePreliminaryGetAnalysisFiles;
  }

  /**
   * Request to generate Prisma schema models.
   *
   * Executes schema generation to create production-ready database models
   * following normalization principles, relationship patterns, and indexing
   * strategies.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval or actual
     * task execution. Value "complete" indicates this is the final task
     * execution request.
     */
    type: "complete";

    /**
     * Strategic database design analysis and planning.
     *
     * Contains the database architecture strategy including table structures,
     * relationships, normalization approach, indexing strategies, and business
     * requirement mapping. This planning phase defines the blueprint for schema
     * implementation.
     *
     * Key planning aspects:
     *
     * - Assignment validation: Extract targetComponent.tables as complete
     *   specification
     * - Table count: Must create exactly targetComponent.tables.length models
     * - Component references: Identify existing tables for foreign key
     *   relationships
     * - Normalization: Strict adherence to 1NF, 2NF, 3NF principles
     * - Snapshot architecture: Design for historical data preservation
     * - Junction tables: Plan M:N relationships with proper naming
     *   ({table1}_{table2})
     * - Materialized views: Identify needs for mv_ prefixed denormalized tables
     */
    plan: string;

    /**
     * Production-ready Prisma schema models.
     *
     * Complete AST representation of all database tables for the target
     * component. Each model implements the planned structure, relationships,
     * indexes, and constraints following best practices.
     *
     * Implementation requirements:
     *
     * - Model count: Exactly matches targetComponent.tables.length (plus junction
     *   tables)
     * - Table names: EXACT names from targetComponent.tables - no modifications
     * - Primary keys: Always UUID type with field name "id"
     * - Foreign keys: Proper IRelation configurations for all relationships
     * - Business fields: Only raw data fields - no calculated or derived values
     * - Data types: Limited to uuid, string, int, double, datetime, boolean, uri
     * - Relationships: Correct patterns for 1:1, 1:N, and M:N
     * - Indexes:
     *
     *   - UniqueIndexes: Business constraints and composite unique keys
     *   - PlainIndexes: Multi-column query optimization (never single FK)
     *   - GinIndexes: Full-text search on appropriate string fields
     * - Materialized views: Tables prefixed with "mv_" have material flag set
     * - Documentation: Comprehensive English descriptions with business context
     *
     * Quality standards:
     *
     * - Strict adherence to 3NF (Third Normal Form)
     * - No denormalization except in materialized views (mv_ tables)
     * - All foreign keys reference valid existing tables
     * - Consistent created_at, updated_at, deleted_at patterns
     * - Proper historical data preservation where needed
     * - Optimized index strategy for expected query patterns
     */
    models: AutoBePrisma.IModel[] & tags.MinItems<1>;
  }
}
