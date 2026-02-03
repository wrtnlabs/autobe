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
   * revision operations (keep, create, update, or erase).
   *
   * **Critical**: Every endpoint in the provided list MUST receive a revision
   * decision. No omissions are allowed - use "keep" to explicitly approve
   * endpoints that need no changes.
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
   * Finalizes the review by submitting revision decisions for ALL endpoints.
   * Every endpoint in the provided list must have exactly one revision:
   *
   * - **keep**: Approve endpoint as-is (explicitly confirm it's correct)
   * - **create**: Add a new endpoint that was missing
   * - **update**: Fix an incorrectly structured endpoint
   * - **erase**: Remove an invalid or duplicate endpoint
   *
   * The revisions ensure the final API structure is consistent, free of
   * duplicates, properly designed, and aligned with RESTful conventions.
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
     * Summary of issues found and fixes applied during review.
     *
     * Document all issues discovered during endpoint validation:
     *
     * - What duplicates, inconsistencies, or design issues were found?
     * - What endpoints needed to be added, modified, or removed?
     * - What patterns or conventions were violated?
     *
     * State "No issues found." if all endpoints pass review.
     */
    review: string;

    /**
     * Revision decisions for ALL endpoints.
     *
     * You MUST provide exactly one revision for each endpoint in the provided
     * list. No omissions allowed.
     *
     * - Use **keep** for endpoints that are correct (do NOT simply omit them)
     * - Use **create** to add missing endpoints
     * - Use **update** to fix incorrectly structured endpoints
     * - Use **erase** to remove invalid or duplicate endpoints
     *
     * The endpoint field in keep, update, and erase must exactly match an
     * endpoint from the provided list (path + method).
     *
     * @see AutoBeInterfaceEndpointRevise - Discriminated union of revision types
     */
    revises: AutoBeInterfaceEndpointRevise[];
  }
}
