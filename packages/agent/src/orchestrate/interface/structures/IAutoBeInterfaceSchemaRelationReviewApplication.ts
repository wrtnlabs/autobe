import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryApplication } from "../../common/structures/IAutoBePreliminaryApplication";

export interface IAutoBeInterfaceSchemaRelationReviewApplication
  extends IAutoBePreliminaryApplication {
  /**
   * Reviews and validates DTO relations and structural patterns in OpenAPI
   * schemas.
   *
   * This specialized relation review function focuses exclusively on data
   * relations, foreign key transformations, and structural integrity. It
   * ensures proper modeling of business domains while preventing circular
   * references and enabling efficient code generation.
   *
   * The review process validates and corrects:
   *
   * - Relation classifications (Composition vs Association vs Aggregation)
   * - Foreign key to object transformations in response DTOs
   * - Actor reversal violations (e.g., User containing articles array)
   * - Inline object extractions to named types with $ref
   * - IInvert pattern applications for alternative perspectives
   *
   * @param props Relation review results including violations found, fixes
   *   applied, and modified schemas
   */
  review: (
    props: IAutoBeInterfaceSchemaRelationReviewApplication.IProps,
  ) => void;
}

export namespace IAutoBeInterfaceSchemaRelationReviewApplication {
  /**
   * Output structure for the relation review function.
   *
   * Contains the relation analysis, structural fixes, and schemas modified for
   * proper relations during the validation process.
   */
  export interface IProps {
    /** Relation analysis and structural planning information. */
    think: IThink;

    /**
     * Modified schemas resulting from relation and structural fixes.
     *
     * Contains ONLY the schemas that were modified for relation or structural
     * reasons during review. This includes both modified existing schemas and
     * newly created schemas (extracted types, IInvert types).
     *
     * Relation modifications include:
     *
     * - Extracting inline objects to named types with $ref
     * - Transforming foreign keys to object references
     * - Removing incorrect reverse relations
     * - Creating new IInvert types for alternative views
     * - Correcting relation types (composition/association/aggregation)
     *
     * Return empty object {} when all relations are already correct and no
     * structural fixes were needed.
     */
    content: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  }

  export interface IThink {
    /**
     * Relation and structural violation findings from the review process.
     *
     * Documents all relation issues discovered during validation, categorized
     * by severity and type. Each violation includes the affected schema,
     * specific relation problem, and theoretical justification.
     *
     * Common violations documented:
     *
     * - CRITICAL: Inline object types instead of named types with $ref
     * - CRITICAL: Actor reversal violations (User.articles[], Seller.sales[])
     * - HIGH: Raw foreign keys instead of object references
     * - HIGH: Wrong relation types (event-driven data as composition)
     * - MEDIUM: Missing IInvert types for independent child views
     * - LOW: Naming convention violations (plural instead of singular)
     *
     * Should state "No relation or structure issues found." when all schemas
     * have correct relations.
     */
    review: string;

    /**
     * Relation corrections and structural fixes applied during review.
     *
     * Lists all relation modifications implemented, organized by fix type and
     * impact. Documents both schemas modified and new schemas created during
     * the fix process.
     *
     * Typical fixes documented:
     *
     * - Inline objects extracted to named types
     * - Foreign keys transformed to object references
     * - Actor reversal arrays removed with API endpoint suggestions
     * - IInvert types created with parent context
     * - Relation types corrected based on lifecycle analysis
     * - Naming conventions standardized
     *
     * Should state "No relation issues require fixes. All relations are
     * properly structured." when no modifications were necessary.
     */
    plan: string;
  }
}
