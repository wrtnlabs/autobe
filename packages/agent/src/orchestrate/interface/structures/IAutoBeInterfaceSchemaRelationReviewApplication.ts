import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeInterfaceSchemaRelationReviewApplication {
  /**
   * Process schema relation review task or preliminary data requests.
   *
   * Reviews and validates DTO relations and structural patterns, ensuring proper
   * modeling of business domains with correct relation classifications, foreign
   * key transformations, and structural integrity.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceSchemaRelationReviewApplication.IProps): void;
}

export namespace IAutoBeInterfaceSchemaRelationReviewApplication {
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
     * (getAnalysisFiles, getPrismaSchemas, getInterfaceSchemas) or final schema
     * relation review (complete). When preliminary returns empty array, that
     * type is removed from the union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPrismaSchemas
      | IAutoBePreliminaryGetInterfaceSchemas;
  }

  /**
   * Request to review and validate schema relations.
   *
   * Executes relation review to ensure proper data relations, foreign key
   * transformations, and structural integrity. Validates relation classifications,
   * prevents circular references, and enables efficient code generation.
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

  /**
   * Structured thinking process for schema relation review.
   *
   * Contains analytical review findings and improvement action plan organized
   * for systematic enhancement of the schemas.
   */
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
