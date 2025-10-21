import { AutoBeOpenApi } from "../openapi";
import { AutoBeEventBase } from "./AutoBeEventBase";
import { AutoBeProgressEventBase } from "./AutoBeProgressEventBase";
import { AutoBeTokenUsageEventBase } from "./AutoBeTokenUsageEventBase";

/**
 * Event fired during the content completeness and consistency review phase of
 * OpenAPI schema generation process.
 *
 * This event represents the final quality assurance activity of the Interface
 * Schema Content Review Agent, which focuses exclusively on ensuring DTOs
 * accurately and completely represent their business entities. The agent
 * validates field completeness, type accuracy, required field settings, and
 * documentation quality after security and relationship reviews are complete.
 *
 * The Interface Schema Content Review Agent performs comprehensive validation
 * including:
 *
 * - Field completeness verification against Prisma schema
 * - Data type accuracy (Prisma to OpenAPI type mappings)
 * - Required field arrays alignment with Prisma nullability
 * - Description quality and business context documentation
 * - Cross-variant consistency (IEntity, ICreate, IUpdate, ISummary)
 * - Missing variant detection and creation
 *
 * Content quality standards enforced:
 *
 * - **Field Completeness**: Every Prisma field represented in appropriate DTOs
 * - **Type Accuracy**: Correct mappings (Int→integer, Decimal→number,
 *   DateTime→string)
 * - **Required Fields**: Accurate reflection of Prisma nullable settings
 * - **Documentation**: Comprehensive descriptions for all schemas and properties
 * - **Variant Consistency**: Same field has identical type across all variants
 *
 * Key characteristics of the content review:
 *
 * - Final quality gate ensuring business domain accuracy
 * - Complete field coverage from database schema
 * - Consistent type definitions across all DTO variants
 * - Meaningful documentation for developer experience
 *
 * The review ensures that all DTOs are complete, consistent, and accurately
 * represent the business domain with comprehensive documentation, serving as the
 * final quality checkpoint before API implementation.
 *
 * @author Kakasoo
 */
export interface AutoBeInterfaceSchemaContentReviewEvent
  extends AutoBeEventBase<"interfaceSchemaContentReview">,
    AutoBeProgressEventBase,
    AutoBeTokenUsageEventBase {
  /**
   * Schemas submitted for content completeness review.
   *
   * Contains the OpenAPI schemas that have passed security and relationship
   * reviews, now requiring validation for field completeness, type accuracy,
   * and documentation quality.
   */
  schemas: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  /**
   * Content completeness findings from the review.
   *
   * Documents all content issues discovered, categorized by type:
   *
   * - Field Completeness: Missing fields from Prisma schema
   * - Type Accuracy: Incorrect type mappings
   * - Required Fields: Misaligned with Prisma nullability
   * - Description Quality: Missing or inadequate descriptions
   * - Variant Consistency: Type inconsistencies across variants
   * - Missing Variants: Required DTO variants not present
   *
   * Each issue includes the affected schema and specific problem identified.
   */
  review: string;

  /**
   * Content improvement plan applied.
   *
   * Outlines the specific content fixes implemented including:
   *
   * - Fields added to match Prisma schema
   * - Type mappings corrected
   * - Required arrays aligned with nullability
   * - Descriptions enhanced for clarity
   * - Variant consistency resolved
   * - Missing variants created
   *
   * If content was already complete and accurate, explicitly states that no
   * fixes were required.
   */
  plan: string;

  /**
   * Schemas modified for content completeness.
   *
   * Contains ONLY the schemas that were actively modified for content reasons,
   * including field additions, type corrections, required array fixes,
   * description enhancements, and newly created variant schemas.
   *
   * An empty object {} indicates all content was already complete and
   * consistent.
   */
  content: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;

  /**
   * Current iteration number of the schema generation being reviewed.
   *
   * Indicates which version of the schemas is undergoing content review,
   * representing the final quality assurance step in the iterative refinement
   * process.
   */
  step: number;
}