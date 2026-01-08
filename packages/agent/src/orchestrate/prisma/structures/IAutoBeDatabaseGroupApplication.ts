import { AutoBeDatabaseGroup } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";

export interface IAutoBeDatabaseGroupApplication {
  /**
   * Process database component group generation task or preliminary data
   * requests.
   *
   * Generate logical groups for organizing database component extraction based
   * on business domains. Processes group generation with incremental context
   * loading to ensure comprehensive organization.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeDatabaseGroupApplication.IProps): void;
}

export namespace IAutoBeDatabaseGroupApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getPreviousAnalysisFiles,
     * getPreviousDatabaseSchemas):
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
     * (getAnalysisFiles, getPreviousAnalysisFiles, getPreviousDatabaseSchemas)
     * or final group generation (complete). When preliminary returns empty
     * array, that type is removed from the union, physically preventing repeated
     * calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas;
  }

  /**
   * Request to generate database component groups.
   *
   * Executes group generation to organize database components based on business
   * domains from requirements.
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
     * Array of database component groups for organizing development.
     *
     * DO: Derive groups from business domains in requirements rather than
     * arbitrary technical divisions. DO: Create foundational groups (Systematic,
     * Actors) separately from domain-specific groups. DO: Organize groups around
     * business workflows and entity relationships. DO: Provide complete coverage
     * of all components without overlap.
     */
    groups: AutoBeDatabaseGroup[] & tags.MinItems<1>;
  }
}
