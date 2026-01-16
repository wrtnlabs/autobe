import {
  AutoBeInterfaceSchemaPropertyCreate,
  AutoBeInterfaceSchemaPropertyErase,
  AutoBeInterfaceSchemaPropertyNullish,
  AutoBeInterfaceSchemaPropertyUpdate,
} from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";

/**
 * Application interface for the comprehensive schema property review agent.
 *
 * This agent performs complete structural validation of DTO schemas through
 * individual property-level operations. Each review produces atomic revision
 * commands with explicit justifications, enabling precise traceability of
 * all schema modifications.
 *
 * ## Review Responsibilities
 *
 * ### 1. Content Completeness
 * Ensures all database fields are properly mapped:
 * - Adds missing fields from database schema
 * - Validates type mappings (Database → OpenAPI)
 * - Adds computed/aggregation fields where needed
 *
 * ### 2. Relation Validation
 * Verifies foreign key references and relationships:
 * - Validates $ref targets exist or will be created
 * - Ensures proper cardinality (1:1, 1:N, M:N)
 * - Transforms FK fields to object references
 *
 * ### 3. Phantom Detection
 * Removes properties not in database schema:
 * - Detects assumed timestamps (updated_at, deleted_at)
 * - Corrects nullable mismatches with database
 * - Removes fields not in x-autobe-database-schema
 *
 * ### 4. Security Enforcement
 * Removes authentication context from request DTOs:
 * - Eliminates actor ID fields (user_id, member_id)
 * - Ensures password fields use plain text (not hashed)
 * - Removes sensitive fields from response DTOs
 *
 * ## Output Format
 *
 * Returns an array of atomic revision commands:
 * - `create`: Add missing property
 * - `erase`: Remove invalid property
 * - `nullish`: Change nullability/required status
 * - `update`: Replace property schema definition
 *
 * Each revision includes a `reason` field for auditability.
 *
 * ## Scope Limitation
 *
 * This agent handles structural correctness ONLY. Description enhancement
 * is handled separately by {@link IAutoBeInterfaceSchemaDepictApplication}.
 *
 * @author Samchon
 */
export interface IAutoBeInterfaceSchemaPropertyApplication {
  /**
   * Process schema property review or preliminary data requests.
   *
   * Reviews individual properties in OpenAPI schema definitions to ensure
   * structural correctness, security compliance, and database consistency.
   * Returns granular property-level revision commands.
   *
   * @param props Request containing either preliminary data request or
   *   complete task with property revisions
   */
  process(props: IAutoBeInterfaceSchemaPropertyApplication.IProps): void;
}

export namespace IAutoBeInterfaceSchemaPropertyApplication {
  /**
   * Input properties for the process function.
   */
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
     * (getAnalysisFiles, getDatabaseSchemas, getInterfaceOperations,
     * getInterfaceSchemas) or final property review (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations
      | IAutoBePreliminaryGetPreviousInterfaceSchemas;
  }

  /**
   * Request to complete property review with granular revisions.
   *
   * Executes property-level review and returns individual revision commands
   * for each change needed. This granular approach provides clear traceability
   * of why each property was added, removed, or modified.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Value "complete" indicates this is the final task execution request
     * containing the property revision results.
     */
    type: "complete";

    /**
     * Human-readable summary of review findings.
     *
     * Documents the overall analysis performed on this schema, including
     * which types of issues were found (phantom fields, security violations,
     * missing fields, type mismatches, etc.).
     */
    review: string;

    /**
     * Array of property revision commands.
     *
     * Each revision represents a single atomic change:
     *
     * - **create**: Add a new property that was missing
     * - **erase**: Remove a property that shouldn't exist
     * - **nullish**: Change only the nullability/required status
     * - **update**: Replace the entire property schema definition
     *
     * The array may be empty if no changes are needed (schema passes review).
     * Each revision includes a `reason` field explaining why the change is
     * necessary.
     */
    revises: Array<
      | AutoBeInterfaceSchemaPropertyCreate
      | AutoBeInterfaceSchemaPropertyErase
      | AutoBeInterfaceSchemaPropertyNullish
      | AutoBeInterfaceSchemaPropertyUpdate
    >;
  }
}
