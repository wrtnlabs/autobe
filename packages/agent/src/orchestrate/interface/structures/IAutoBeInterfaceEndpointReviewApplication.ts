import { AutoBeInterfaceEndpointRevise } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";

export interface IAutoBeInterfaceEndpointReviewApplication {
  /**
   * Process endpoint review task or preliminary data requests.
   *
   * Reviews and validates generated endpoints to ensure they meet quality
   * standards. The review process examines endpoint design, identifies issues
   * such as duplicates or inconsistencies, and applies corrections through
   * create, update, or erase operations. This ensures the final API structure
   * is clean, consistent, and maintainable.
   *
   * @param props Request containing either preliminary data request or endpoint
   *   review completion
   */
  process(props: IAutoBeInterfaceEndpointReviewApplication.IProps): void;
}

export namespace IAutoBeInterfaceEndpointReviewApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getDatabaseSchemas, etc.):
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
     * (getAnalysisFiles, getDatabaseSchemas, getPreviousAnalysisFiles,
     * getPreviousDatabaseSchemas, getPreviousInterfaceOperations) or completion
     * of the review with all modifications (complete). When preliminary returns
     * empty array, that type is removed from the union, physically preventing
     * repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations;
  }

  /**
   * Request to complete the endpoint review process.
   *
   * Finalizes the review by submitting all identified endpoint modifications.
   * The modifications (create, update, erase) are applied to ensure the final
   * API structure is consistent, free of duplicates, properly designed, and
   * aligned with RESTful conventions and AutoBE standards.
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

    /**
     * All endpoint revisions to apply.
     *
     * Include all create, update, and erase operations identified during review.
     * Revisions are validated and applied in order. If no modifications are
     * needed, provide an empty array.
     *
     * @see AutoBeInterfaceEndpointRevise - Discriminated union of revision types
     */
    revises: AutoBeInterfaceEndpointRevise[];
  }
}
