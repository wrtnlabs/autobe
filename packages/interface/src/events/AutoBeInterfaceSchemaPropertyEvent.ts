import { AutoBeInterfaceSchemaPropertyRevise } from "../histories/contents/AutoBeInterfaceSchemaPropertyRevise";
import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event emitted when a DTO schema undergoes comprehensive property-level
 * review.
 *
 * This event represents the result of the unified schema property review agent,
 * which validates and corrects DTO schema structure through individual
 * property-level operations. The agent performs four critical review
 * functions:
 *
 * ## Review Responsibilities
 *
 * ### 1. Content Completeness
 *
 * Ensures every database field is properly mapped to the DTO:
 *
 * - Detects missing fields that exist in database but absent in schema
 * - Adds computed fields and aggregation properties (COUNT, AVG, SUM)
 * - Validates field types match database-to-OpenAPI type mapping rules
 *
 * ### 2. Relation Validation
 *
 * Verifies foreign key references and relationship structures:
 *
 * - Validates `$ref` targets exist or will be created
 * - Ensures relation cardinality matches database schema (1:1, 1:N, M:N)
 * - Transforms FK fields to object references where appropriate
 *
 * ### 3. Phantom Detection
 *
 * Removes properties that don't exist in database schema:
 *
 * - Detects phantom timestamps (assuming all tables have updated_at, deleted_at)
 * - Removes fields not defined in `x-autobe-database-schema` linked model
 * - Corrects nullable mismatches between database and DTO schema
 *
 * ### 4. Security Enforcement
 *
 * Removes authentication context fields from request DTOs:
 *
 * - Eliminates actor ID fields (user_id, member_id) from Create/Update DTOs
 * - Ensures password fields use plain text (not hashed) in request DTOs
 * - Removes sensitive fields from response DTOs (password, salt, tokens)
 *
 * ## Output Format
 *
 * The agent outputs individual property-level revisions with explicit reasons,
 * enabling precise traceability of every change made to the schema. This
 * granular approach supports:
 *
 * - Debugging when schema generation produces unexpected results
 * - UI progress visualization showing incremental corrections
 * - Audit trails for schema modification decisions
 *
 * ## Scope Limitation
 *
 * This agent focuses exclusively on **structural correctness and security**.
 * Description quality and documentation enhancement is handled separately by
 * the {@link AutoBeInterfaceSchemaDepictEvent} agent, which runs after property
 * review is complete.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaPropertyEvent
  extends
    AutoBeEventBase<"interfaceSchemaProperty">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Type name of the schema being reviewed.
   *
   * Specifies the specific DTO type name that is being validated in this
   * review. Examples: "IUser.ICreate", "IProduct.ISummary", "IBbsArticle"
   */
  typeName: string;

  /**
   * Original schema submitted for review.
   *
   * Contains the OpenAPI schema requiring validation according to the review
   * kind. The schema is the full descriptive JSON schema structure with
   * AutoBE-specific metadata including `x-autobe-database-schema` linking.
   */
  schema: AutoBeOpenApi.IJsonSchemaDescriptive;

  /**
   * Human-readable summary of the review findings.
   *
   * Documents the overall analysis performed on this schema, including:
   *
   * - Fields that were found to be missing from database mapping
   * - Phantom fields that don't exist in the database schema
   * - Security violations such as authentication context in request DTOs
   * - Relation issues with foreign key references
   *
   * This field provides context for the specific revisions that follow.
   */
  review: string;

  /**
   * Array of individual property-level changes applied to the schema.
   *
   * Each revision represents a single atomic change with its explicit reason.
   * The revisions form a discriminated union of:
   *
   * - {@link AutoBeInterfaceSchemaPropertyCreate}: Add a new property
   * - {@link AutoBeInterfaceSchemaPropertyErase}: Remove an existing property
   * - {@link AutoBeInterfaceSchemaPropertyNullish}: Change nullability/required
   *   status
   * - {@link AutoBeInterfaceSchemaPropertyUpdate}: Replace property definition
   *
   * The array may be empty if no changes are needed (schema passes review).
   */
  revises: AutoBeInterfaceSchemaPropertyRevise[];

  /**
   * Current iteration number of the schema generation being reviewed.
   *
   * Indicates which version of the schemas is undergoing validation, helping
   * track the iterative refinement process during spiral loops.
   */
  step: number;
}
