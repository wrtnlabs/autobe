import { AutoBeOpenApi } from "../openapi/AutoBeOpenApi";
import { AutoBeAggregateEventBase } from "./base/AutoBeAggregateEventBase";
import { AutoBeEventBase } from "./base/AutoBeEventBase";
import { AutoBeProgressEventBase } from "./base/AutoBeProgressEventBase";

/**
 * Event fired during the multi-dimensional review and validation phase of
 * OpenAPI schema generation process.
 *
 * This event represents the unified validation activity of specialized
 * Interface Schema Review Agents, which ensure schemas are secure, structurally
 * sound, and complete. The event supports three distinct review kinds executed
 * sequentially: security, relation, and content validation.
 *
 * The Interface Schema Review Agents perform comprehensive validation
 * including:
 *
 * - **Security** (`kind: "security"`): Authentication context removal,
 *   password/token field protection, phantom field detection, system-managed
 *   field protection
 * - **Relation** (`kind: "relation"`): Relation classification, foreign key to
 *   object transformation, actor reversal prohibition, $ref extraction
 * - **Content** (`kind: "content"`): Field completeness, type accuracy, required
 *   field alignment, cross-variant consistency
 *
 * Review execution order:
 *
 * 1. Security review removes dangerous fields and prevents vulnerabilities
 * 2. Relation review structures relationships between clean schemas
 * 3. Content review validates completeness of secure, well-structured schemas
 *
 * Each review kind focuses on its specialized domain while contributing to
 * production-ready, type-safe OpenAPI schemas that accurately model the
 * business domain.
 *
 * @author Samchon
 */
export interface AutoBeInterfaceSchemaReviewEvent
  extends AutoBeEventBase<"interfaceSchemaReview">,
    AutoBeProgressEventBase,
    AutoBeAggregateEventBase {
  /**
   * Review dimension discriminator.
   *
   * Specifies which specialized agent is performing validation:
   *
   * - `"security"`: Security validation for authentication and data protection
   * - `"relation"`: Relation validation for DTO relationships and structure
   * - `"content"`: Content validation for field completeness and accuracy
   */
  kind: "security" | "relation" | "content" | "phantom";

  /**
   * Original schemas submitted for review.
   *
   * Contains the OpenAPI schemas requiring validation according to the review
   * kind. Each entry is keyed by schema name and contains the full descriptive
   * JSON schema structure with AutoBE-specific metadata.
   */
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  /**
   * Violation findings from the review.
   *
   * Documents all issues discovered during validation, categorized by severity
   * or type according to the review kind:
   *
   * - **Security**: CRITICAL/HIGH/MEDIUM/LOW severity violations
   * - **Relation**: CRITICAL/HIGH/MEDIUM/LOW relation issues
   * - **Content**: Field completeness, type accuracy, description quality issues
   *
   * Each finding includes the affected schema, specific problem, and correction
   * justification.
   */
  review: string;

  /**
   * Correction plan applied.
   *
   * Outlines the specific fixes implemented to address identified violations.
   * Details vary by review kind but always include concrete changes made to
   * ensure compliance.
   *
   * If schemas were already compliant, explicitly states that no fixes were
   * required.
   */
  plan: string;

  /**
   * Schemas modified for compliance.
   *
   * Contains ONLY the schemas that were actively modified to fix violations.
   * Schemas that passed validation without changes are not included.
   *
   * For relation reviews, may also include newly created schemas (extracted
   * types, IInvert types).
   *
   * An empty object {} indicates all schemas were already compliant.
   */
  content: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  /**
   * Current iteration number of the schema generation being reviewed.
   *
   * Indicates which version of the schemas is undergoing validation, helping
   * track the iterative refinement process.
   */
  step: number;
}
