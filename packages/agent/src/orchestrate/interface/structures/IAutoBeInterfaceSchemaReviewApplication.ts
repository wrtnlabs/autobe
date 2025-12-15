import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousPrismaSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeInterfaceSchemaReviewApplication {
  /**
   * Process schema review task or preliminary data requests.
   *
   * Reviews and validates OpenAPI schema definitions to ensure quality,
   * correctness, and compliance with domain requirements and system policies.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceSchemaReviewApplication.IProps): void;
}
export namespace IAutoBeInterfaceSchemaReviewApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getPrismaSchemas, etc.):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     *
     * - What key assets did you acquire?
     * - What did you accomplish?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every single item.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles, getPrismaSchemas, getInterfaceOperations,
     * getInterfaceSchemas) or final schema review (complete). When preliminary
     * returns empty array, that type is removed from the union, physically
     * preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPrismaSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousPrismaSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations
      | IAutoBePreliminaryGetPreviousInterfaceSchemas;
  }

  /**
   * Request to review and validate schemas.
   *
   * Executes schema review to ensure DTOs meet quality standards and comply
   * with domain requirements. Validates schema structure, content, and
   * adherence to system policies.
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

    /** Analysis and planning information for the review process. */
    think: IThink;

    /**
     * Modified schemas resulting from review fixes.
     *
     * Contains ONLY the schemas that were modified during the review process.
     * This includes both modified existing schemas and newly created schemas.
     *
     * Return empty object {} when all schemas are already correct and no
     * modifications were needed.
     */
    content: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  }

  /**
   * Structured thinking process for schema review.
   *
   * Contains analytical review findings and improvement action plan organized
   * for systematic enhancement of the schemas.
   */
  export interface IThink {
    /**
     * Findings from the review process.
     *
     * Documents all issues discovered during validation, categorized by type
     * and severity. Each issue includes the affected schema and specific
     * problem identified.
     *
     * Should state "No issues found." when all schemas pass validation.
     */
    review: string;

    /**
     * Corrections and fixes applied during review.
     *
     * Lists all modifications implemented during the review process, organized
     * by fix type. Documents both schemas modified and new schemas created.
     *
     * Should state "No issues require fixes. All schemas are correct." when no
     * modifications were necessary.
     */
    plan: string;
  }
}
