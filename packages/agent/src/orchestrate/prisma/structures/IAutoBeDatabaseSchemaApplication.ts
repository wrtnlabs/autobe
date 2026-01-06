import { AutoBeDatabase } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseSchemaApplication {
  /**
   * Process schema generation task or preliminary data requests.
   *
   * Generates database models for the target component following normalization
   * principles and database design best practices.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeDatabaseSchemaApplication.IProps): void;
}
export namespace IAutoBeDatabaseSchemaApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getDatabaseSchemas, etc.):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     *
     * - What key assets did you acquire?
     * - What did you accomplish?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every single item.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles, getPreviousAnalysisFiles, getPreviousDatabaseSchemas)
     * or final schema generation (complete). When preliminary returns empty
     * array, that type is removed from the union, physically preventing
     * repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Request to generate database schema models.
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
     * Contains the database architecture strategy for the single target table,
     * including structure, relationships, normalization approach, indexing
     * strategies, and business requirement mapping. This planning phase defines
     * the blueprint for the table model implementation.
     *
     * Key planning aspects:
     *
     * - Assignment validation: Extract targetTable as the assignment
     * - Table responsibility: Create exactly ONE table matching targetTable
     * - Other tables: Identify existing tables from otherComponents for foreign
     *   key relationships
     * - Normalization: Strict adherence to 1NF, 2NF, 3NF principles
     * - Snapshot architecture: Design for historical data preservation
     * - Junction tables: Plan M:N relationships with proper naming
     *   ({table1}_{table2})
     * - Materialized views: Identify needs for mv_ prefixed denormalized tables
     */
    plan: string;

    /**
     * Production-ready database schema model for a single table.
     *
     * Complete AST representation of ONE database table for the target
     * component. The model implements the planned structure, relationships,
     * indexes, and constraints following best practices.
     *
     * Implementation requirements:
     *
     * - Exactly one model for the specific targetTable
     * - Table name: EXACT name from targetTable parameter - no modifications
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
    model: AutoBeDatabase.IModel;
  }
}
