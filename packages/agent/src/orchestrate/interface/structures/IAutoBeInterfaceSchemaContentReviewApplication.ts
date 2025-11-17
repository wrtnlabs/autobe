import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeInterfaceSchemaContentReviewApplication {
  /**
   * Process schema content review task or preliminary data requests.
   *
   * Reviews and validates DTO content completeness and consistency, ensuring
   * DTOs accurately represent business entities with proper field completeness,
   * type accuracy, and documentation quality.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceSchemaContentReviewApplication.IProps): void;
}

export namespace IAutoBeInterfaceSchemaContentReviewApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on your
     * current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getPrismaSchemas, etc.):
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     * - What key assets did you acquire?
     * - What did you accomplish?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every single item.
     *
     * This reflection helps you avoid duplicate requests and premature completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles, getPrismaSchemas, getInterfaceOperations,
     * getInterfaceSchemas) or final schema content review (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPrismaSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas;
  }

  /**
   * Request to review and validate schema content.
   *
   * Executes content review to ensure DTOs accurately and completely represent
   * business entities. Validates field completeness, type accuracy, required
   * fields, descriptions, variant consistency, and missing variants.
   */
  export interface IComplete {
    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval or actual
     * task execution. Value "complete" indicates this is the final task
     * execution request.
     */
    type: "complete";

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

  /**
   * Structured thinking process for schema content review.
   *
   * Contains analytical review findings and improvement action plan organized
   * for systematic enhancement of the schemas.
   */
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
