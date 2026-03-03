import {
  AutoBeInterfaceSchemaPropertyExclude,
  AutoBeInterfaceSchemaPropertyRefine,
} from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetAnalysisSections";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisSections } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisSections";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";

/**
 * Function calling interface for enriching pure JSON Schema with documentation
 * and metadata.
 *
 * Guides the AI agent through adding `databaseSchemaProperty`, `specification`,
 * and `description` to each property in a schema that was initially generated
 * with only type structure. The refinement process ensures complete and
 * accurate schema definitions that properly map to database entities.
 *
 * The refinement follows a structured RAG workflow: preliminary context
 * gathering (analysis files, database schemas, interface operations) followed
 * by property-level enrichment operations.
 *
 * @author Samchon
 */
export interface IAutoBeInterfaceSchemaRefineApplication {
  /**
   * Process schema refinement task or preliminary data requests.
   *
   * Enriches OpenAPI schema definitions with documentation and metadata that
   * were omitted during initial generation. Processes property-level additions
   * including database field mappings, implementation specifications, and API
   * consumer descriptions.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceSchemaRefineApplication.IProps): void;
}
export namespace IAutoBeInterfaceSchemaRefineApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisSections, getDatabaseSchemas, etc.):
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
     * (getAnalysisSections, getDatabaseSchemas, getInterfaceOperations,
     * getInterfaceSchemas) or final schema refinement (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisSections
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas
      | IAutoBePreliminaryGetPreviousAnalysisSections
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations
      | IAutoBePreliminaryGetPreviousInterfaceSchemas;
  }

  /**
   * Complete schema refinement with object-level and property-level enrichment.
   *
   * Executes the refinement to add documentation and metadata to a schema.
   * Includes both object-level context (databaseSchema, specification,
   * description) and property-level operations (depict, create, update,
   * erase).
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Value "complete" indicates this is the final task execution request after
     * all preliminary data has been gathered.
     */
    type: "complete";

    /**
     * Summary of refinement analysis and actions taken.
     *
     * Documents the agent's analysis of the schema's current state, including
     * which properties need documentation, any structural issues discovered,
     * and the overall assessment of what enrichment was performed.
     */
    review: string;

    /**
     * Database schema context for the type.
     *
     * Specifies which database table or entity this schema maps to, providing
     * context for property-level database field mappings. This establishes the
     * source of truth for data validation and transformation logic.
     *
     * Set to `null` for schemas that don't directly map to a single database
     * table (e.g., computed aggregations, cross-table joins, utility types).
     */
    databaseSchema: string | null;

    /**
     * Specification for the schema implementation.
     *
     * Documents HOW the schema should be implemented, including data source
     * mappings, transformation rules, and technical implementation details.
     *
     * **MANDATORY**: You must always provide this value, even if the existing
     * specification is correct. This forces explicit review and strengthens
     * reasoning about the implementation details.
     */
    specification: string;

    /**
     * Description for API consumers.
     *
     * Documents WHAT the schema represents for API consumers, explaining the
     * purpose and usage of this data type in the API context.
     *
     * **MANDATORY**: You must always provide this value, even if the existing
     * description is correct. This forces explicit review and strengthens
     * reasoning about the API documentation.
     */
    description: string;

    /**
     * Database properties explicitly excluded from this DTO.
     *
     * Declare every database property that intentionally does not appear in
     * this DTO. Together with `revises`, this must cover every database
     * property — each one must appear in exactly one of the two arrays.
     */
    excludes: AutoBeInterfaceSchemaPropertyExclude[];

    /**
     * Property-level refinement operations for DTO properties.
     *
     * Every DTO property must appear exactly once with one of:
     *
     * - `depict`: Add documentation to existing property
     * - `create`: Add missing property with documentation
     * - `update`: Fix incorrect type and add documentation
     * - `erase`: Remove invalid property
     *
     * Each operation includes the property key, reason for the action, and
     * complete metadata including `databaseSchemaProperty`, `specification`,
     * and `description`.
     *
     * Database properties are addressed either here (via
     * `databaseSchemaProperty`) or in `excludes`. No property can be omitted.
     */
    revises: AutoBeInterfaceSchemaPropertyRefine[];
  }
}
