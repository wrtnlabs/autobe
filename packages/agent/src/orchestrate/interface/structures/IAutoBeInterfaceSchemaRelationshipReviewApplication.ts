import { AutoBeOpenApi } from "@autobe/interface";

export interface IAutoBeInterfaceSchemaRelationshipReviewApplication {
  /**
   * Reviews and validates DTO relationships and structural patterns in OpenAPI
   * schemas.
   *
   * This specialized relationship review function focuses exclusively on data
   * relationships, foreign key transformations, and structural integrity. It
   * ensures proper modeling of business domains while preventing circular
   * references and enabling efficient code generation.
   *
   * The review process validates and corrects:
   *
   * - Relationship classifications (Composition vs Association vs Aggregation)
   * - Foreign key to object transformations in response DTOs
   * - Actor reversal violations (e.g., User containing articles array)
   * - Inline object extractions to named types with $ref
   * - IInvert pattern applications for alternative perspectives
   *
   * @param props Relationship review results including violations found, fixes
   *   applied, and modified schemas
   */
  review: (
    props: IAutoBeInterfaceSchemaRelationshipReviewApplication.IProps,
  ) => void;
}

export namespace IAutoBeInterfaceSchemaRelationshipReviewApplication {
  /**
   * Output structure for the relationship review function.
   *
   * Contains the relationship analysis, structural fixes, and schemas modified
   * for proper relationships during the validation process.
   */
  export interface IProps {
    /** Relationship analysis and structural planning information. */
    think: IThink;

    /**
     * Modified schemas resulting from relationship and structural fixes.
     *
     * Contains ONLY the schemas that were modified for relationship or
     * structural reasons during review. This includes both modified existing
     * schemas and newly created schemas (extracted types, IInvert types).
     *
     * Relationship modifications include:
     *
     * - Extracting inline objects to named types with $ref
     * - Transforming foreign keys to object references
     * - Removing incorrect reverse relationships
     * - Creating new IInvert types for alternative views
     * - Correcting relationship types (composition/association/aggregation)
     *
     * Return empty object {} when all relationships are already correct and no
     * structural fixes were needed.
     */
    content: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  }

  export interface IThink {
    /**
     * Relationship and structural violation findings from the review process.
     *
     * Documents all relationship issues discovered during validation,
     * categorized by severity and type. Each violation includes the affected
     * schema, specific relationship problem, and theoretical justification.
     *
     * Common violations documented:
     *
     * - CRITICAL: Inline object types instead of named types with $ref
     * - CRITICAL: Actor reversal violations (User.articles[], Seller.sales[])
     * - HIGH: Raw foreign keys instead of object references
     * - HIGH: Wrong relationship types (event-driven data as composition)
     * - MEDIUM: Missing IInvert types for independent child views
     * - LOW: Naming convention violations (plural instead of singular)
     *
     * Should state "No relationship or structure issues found." when all
     * schemas have correct relationships.
     */
    review: string;

    /**
     * Relationship corrections and structural fixes applied during review.
     *
     * Lists all relationship modifications implemented, organized by fix type
     * and impact. Documents both schemas modified and new schemas created
     * during the fix process.
     *
     * Typical fixes documented:
     *
     * - Inline objects extracted to named types
     * - Foreign keys transformed to object references
     * - Actor reversal arrays removed with API endpoint suggestions
     * - IInvert types created with parent context
     * - Relationship types corrected based on lifecycle analysis
     * - Naming conventions standardized
     *
     * Should state "No relationship issues require fixes. All relationships are
     * properly structured." when no modifications were necessary.
     */
    plan: string;
  }
}
