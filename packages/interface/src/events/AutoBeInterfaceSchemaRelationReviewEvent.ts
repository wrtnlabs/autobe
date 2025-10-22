import { AutoBeOpenApi } from "../openapi";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

/**
 * Event fired during the relation and structure review phase of OpenAPI schema
 * generation process.
 *
 * This event represents the specialized relation validation activity of the
 * Interface Schema Relation Review Agent, which focuses exclusively on DTO
 * relations, foreign key transformations, and structural integrity. The agent
 * ensures proper modeling of business domains while preventing circular
 * references and enabling efficient code generation.
 *
 * The Interface Schema Relation Review Agent performs targeted validation
 * including:
 *
 * - Relation classification (Composition vs Association vs Aggregation)
 * - Foreign key to object reference transformation in response DTOs
 * - Actor reversal violation detection and removal (e.g., User.articles[])
 * - Inline object extraction to named types with $ref
 * - IInvert pattern application for alternative perspectives
 * - Structural integrity and naming convention enforcement
 *
 * Relation principles enforced:
 *
 * - **Composition**: Same transaction, parent owns children, CASCADE DELETE
 * - **Association**: Independent entities providing context, survive parent
 *   deletion
 * - **Aggregation**: Event-driven data, different actors, separate APIs
 * - **Actor Reversal Prohibition**: Actors never contain entity arrays
 *
 * Key characteristics of the relation review:
 *
 * - Every object type must be named and referenced with $ref
 * - Foreign keys transformed to objects for complete information
 * - Proper lifecycle-based relation classification
 * - Prevention of unbounded reverse relations
 *
 * The review ensures that all DTOs accurately model the business domain with
 * proper relations that enable code generation while preventing performance
 * problems and circular dependencies.
 *
 * @author Kakasoo
 */
export interface AutoBeInterfaceSchemaRelationReviewEvent
  extends AutoBeEventBase<"interfaceSchemaRelationReview">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
  /**
   * Original schemas submitted for relation review.
   *
   * Contains the OpenAPI schemas that need relation and structural validation,
   * including all DTOs with foreign keys, nested objects, or relation
   * definitions requiring verification.
   */
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  /**
   * Relation violation findings from the review.
   *
   * Documents all relation and structural issues discovered, categorized by
   * type:
   *
   * - CRITICAL: Inline object types, actor reversal violations
   * - HIGH: Raw foreign keys, wrong relation types
   * - MEDIUM: Missing IInvert types
   * - LOW: Naming convention violations
   *
   * Each violation includes the affected schema, specific problem, and
   * theoretical justification for the correction.
   */
  review: string;

  /**
   * Relation correction plan applied.
   *
   * Outlines the specific relation fixes implemented including:
   *
   * - Inline objects extracted to named types
   * - Foreign keys transformed to object references
   * - Actor reversal arrays removed
   * - IInvert types created
   * - Relation types corrected
   *
   * If relations were already correct, explicitly states that no fixes were
   * required.
   */
  plan: string;

  /**
   * Schemas modified for relation compliance.
   *
   * Contains ONLY the schemas that were actively modified to fix relation or
   * structural issues, including both modified existing schemas and newly
   * created schemas (extracted types, IInvert types).
   *
   * An empty object {} indicates all relations were already properly
   * structured.
   */
  content: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  /**
   * Current iteration number of the schema generation being reviewed.
   *
   * Indicates which version of the schemas is undergoing relation review,
   * helping track the iterative structural refinement process.
   */
  step: number;
}
