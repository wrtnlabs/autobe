import { AutoBeInterfaceSchemaDepict } from "../histories/contents/AutoBeInterfaceSchemaDepict";
import { AutoBeOpenApi } from "../openapi";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event emitted when a DTO schema undergoes description enhancement.
 *
 * This event represents the result of the schema depiction agent that focuses
 * exclusively on improving documentation quality within DTO schemas. The agent
 * does NOT modify schema structure - only `description` fields are touched.
 *
 * ## Responsibilities
 *
 * ### Schema-Level Descriptions
 * Comprehensive, multi-paragraph documentation for the type itself:
 * - First line: Brief summary of the type's purpose
 * - Following paragraphs: Detailed explanation, relationships, usage context
 *
 * Example:
 * ```
 * Product sale listings in the shopping marketplace.
 *
 * Represents individual products listed for sale by sellers, including
 * pricing, inventory, and availability information. Each sale references
 * a specific product and is owned by an authenticated seller.
 *
 * Used in creation (ICreate), updates (IUpdate), search results (ISummary),
 * and detailed retrieval responses.
 * ```
 *
 * ### Property-Level Descriptions
 * Clear, detailed documentation for each field:
 * - Purpose of the field
 * - Business rules and constraints
 * - Validation requirements
 * - Format information
 *
 * ### Database Comment Integration
 * Incorporates Prisma `///` annotations into descriptions:
 * ```prisma
 * model User {
 *   /// Email verification status. Users must verify to access features.
 *   verified Boolean @default(false)
 * }
 * ```
 *
 * ## Execution Order
 *
 * Depiction runs AFTER {@link AutoBeInterfaceSchemaPropertyEvent} completes.
 * This ensures descriptions are written for the final, structurally correct
 * schema. The agent receives the schema with all property revisions applied.
 *
 * ## Scope Limitation
 *
 * This agent handles documentation ONLY. It cannot:
 * - Add or remove properties
 * - Change property types or formats
 * - Modify the `required` array
 * - Create new schema types
 *
 * Structural changes are the responsibility of the property review agent.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaDepictEvent
  extends
    AutoBeEventBase<"interfaceSchemaDepict">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Type name of the schema being documented.
   *
   * Specifies the specific DTO type name receiving description enhancement.
   * Examples: "IUser.ICreate", "IProduct.ISummary", "IBbsArticle"
   */
  typeName: string;

  /**
   * Schema submitted for description enhancement.
   *
   * Contains the OpenAPI schema that has already passed property review and now
   * needs documentation improvement. The schema structure is considered stable
   * at this point.
   */
  schema: AutoBeOpenApi.IJsonSchemaDescriptive;

  /**
   * Human-readable summary of documentation improvements needed.
   *
   * Documents the analysis of current description quality, identifying:
   *
   * - Missing or inadequate schema-level descriptions
   * - Properties with brief or redundant descriptions
   * - Opportunities to add business context or validation rules
   * - Database comments that should be incorporated
   */
  review: string;

  /**
   * Array of description enhancement commands.
   *
   * Each depiction represents a single description update with its rationale.
   * The `key` field determines the target:
   *
   * - `null`: Update the schema-level description
   * - `"propertyName"`: Update a specific property's description
   */
  depicts: AutoBeInterfaceSchemaDepict[];

  /**
   * Current iteration number of the schema generation.
   *
   * Indicates which version of the schemas is undergoing documentation
   * enhancement, tracking progress through spiral loops.
   */
  step: number;
}
