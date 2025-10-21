import { AutoBeOpenApi } from "@autobe/interface";

export interface IAutoBeInterfaceSchemaContentReviewApplication {
  /**
   * Reviews and validates DTO content completeness and consistency in OpenAPI
   * schemas.
   *
   * This specialized content review function focuses exclusively on ensuring
   * DTOs accurately and completely represent their business entities. It
   * validates field completeness, type accuracy, required field settings, and
   * documentation quality.
   *
   * The review process validates and corrects:
   *
   * - Field completeness against Prisma schema
   * - Data type accuracy (Prisma to OpenAPI type mappings)
   * - Required field arrays matching Prisma nullability
   * - Description quality and comprehensiveness
   * - Consistency across DTO variants (IEntity, ICreate, IUpdate, ISummary)
   * - Missing variant detection and creation
   *
   * @param props Content review results including completeness issues found,
   *   fixes applied, and modified schemas
   */
  review: (
    props: IAutoBeInterfaceSchemaContentReviewApplication.IProps,
  ) => void;
}

export namespace IAutoBeInterfaceSchemaContentReviewApplication {
  /**
   * Output structure for the content review function.
   *
   * Contains the content analysis, completeness fixes, and schemas modified for
   * content quality during the validation process.
   */
  export interface IProps {
    /** Content analysis and completeness planning information. */
    think: IThink;

    /**
     * Modified schemas resulting from content and completeness fixes.
     *
     * Contains ONLY the schemas that were modified for content reasons during
     * review. This includes both modified existing schemas and newly created
     * variant schemas.
     *
     * Content modifications include:
     *
     * - Adding missing fields from Prisma schema
     * - Correcting data type mappings
     * - Fixing required field arrays
     * - Enhancing or adding descriptions
     * - Creating missing variant types (ISummary, IUpdate, etc.)
     * - Ensuring cross-variant consistency
     *
     * Return empty object {} when all content is already complete and accurate,
     * requiring no modifications.
     */
    content: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  }

  export interface IThink {
    /**
     * Content completeness and quality findings from the review process.
     *
     * Documents all content issues discovered during validation, categorized by
     * type: field completeness, type accuracy, required fields, descriptions,
     * variant consistency, and missing variants. Each issue includes the
     * affected schema and specific problem identified.
     *
     * Common issues documented:
     *
     * - Field Completeness: Missing fields that exist in Prisma schema
     * - Type Accuracy: Incorrect type mappings (e.g., Decimal as string)
     * - Required Fields: Misaligned with Prisma nullable settings
     * - Description Quality: Missing or inadequate descriptions
     * - Variant Consistency: Same field with different types across variants
     * - Missing Variants: Required DTO variants not present
     *
     * Should state "No content or completeness issues found." when all schemas
     * have complete and accurate content.
     */
    review: string;

    /**
     * Content corrections and completeness fixes applied during review.
     *
     * Lists all content modifications implemented, organized by fix type:
     * fields added, types corrected, required arrays fixed, descriptions
     * enhanced, consistency fixes, and variants created. Documents both field-
     * level changes and schema-level additions.
     *
     * Typical fixes documented:
     *
     * - Fields added to match Prisma schema
     * - Type mappings corrected (Int→integer, Decimal→number)
     * - Required arrays aligned with nullability
     * - Descriptions added or enhanced for clarity
     * - Variant consistency issues resolved
     * - Missing variants created with appropriate fields
     *
     * Should state "No content issues require fixes. All DTOs are complete and
     * consistent." when no content modifications were necessary.
     */
    plan: string;
  }
}
