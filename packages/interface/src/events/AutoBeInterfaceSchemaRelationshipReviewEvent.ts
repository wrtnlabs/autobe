import { AutoBeOpenApi } from "../openapi";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

/**
 * Event fired during the relationship and structure review phase of OpenAPI
 * schema generation process.
 *
 * This event represents the specialized relationship validation activity of the
 * Interface Schema Relationship Review Agent, which focuses exclusively on DTO
 * relationships, foreign key transformations, and structural integrity. The
 * agent ensures proper modeling of business domains while preventing circular
 * references and enabling efficient code generation.
 *
 * The Interface Schema Relationship Review Agent performs targeted validation
 * including:
 *
 * - Relationship classification (Composition vs Association vs Aggregation)
 * - Foreign key to object reference transformation in response DTOs
 * - Actor reversal violation detection and removal (e.g., User.articles[])
 * - Inline object extraction to named types with $ref
 * - IInvert pattern application for alternative perspectives
 * - Structural integrity and naming convention enforcement
 *
 * Relationship principles enforced:
 *
 * - **Composition**: Same transaction, parent owns children, CASCADE DELETE
 * - **Association**: Independent entities providing context, survive parent
 *   deletion
 * - **Aggregation**: Event-driven data, different actors, separate APIs
 * - **Actor Reversal Prohibition**: Actors never contain entity arrays
 *
 * Key characteristics of the relationship review:
 *
 * - Every object type must be named and referenced with $ref
 * - Foreign keys transformed to objects for complete information
 * - Proper lifecycle-based relationship classification
 * - Prevention of unbounded reverse relationships
 *
 * The review ensures that all DTOs accurately model the business domain with
 * proper relationships that enable code generation while preventing performance
 * problems and circular dependencies.
 *
 * @author Kakasoo
 */
export interface AutoBeInterfaceSchemaRelationshipReviewEvent
  extends AutoBeEventBase<"interfaceSchemaRelationshipReview">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
  /**
   * Original schemas submitted for relationship review.
   *
   * Contains the OpenAPI schemas that need relationship and structural
   * validation, including all DTOs with foreign keys, nested objects, or
   * relationship definitions requiring verification.
   */
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  /**
   * Relationship violation findings from the review.
   *
   * Documents all relationship and structural issues discovered, categorized by
   * type:
   *
   * - CRITICAL: Inline object types, actor reversal violations
   * - HIGH: Raw foreign keys, wrong relationship types
   * - MEDIUM: Missing IInvert types
   * - LOW: Naming convention violations
   *
   * Each violation includes the affected schema, specific problem, and
   * theoretical justification for the correction.
   */
  review: string;

  /**
   * Relationship correction plan applied.
   *
   * Outlines the specific relationship fixes implemented including:
   *
   * - Inline objects extracted to named types
   * - Foreign keys transformed to object references
   * - Actor reversal arrays removed
   * - IInvert types created
   * - Relationship types corrected
   *
   * If relationships were already correct, explicitly states that no fixes were
   * required.
   */
  plan: string;

  /**
   * Schemas modified for relationship compliance.
   *
   * Contains ONLY the schemas that were actively modified to fix relationship
   * or structural issues, including both modified existing schemas and newly
   * created schemas (extracted types, IInvert types).
   *
   * An empty object {} indicates all relationships were already properly
   * structured.
   */
  content: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  /**
   * Current iteration number of the schema generation being reviewed.
   *
   * Indicates which version of the schemas is undergoing relationship review,
   * helping track the iterative structural refinement process.
   */
  step: number;
}