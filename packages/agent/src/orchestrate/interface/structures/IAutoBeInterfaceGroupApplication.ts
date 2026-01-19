import { AutoBeInterfaceGroup } from "@autobe/interface";
import { tags } from "typia";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";

export interface IAutoBeInterfaceGroupApplication {
  /**
   * Process group generation task or preliminary data requests.
   *
   * Generate logical groups for organizing API endpoint creation based on
   * database schema structure. Processes group generation with incremental
   * context loading to ensure comprehensive organization.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceGroupApplication.IProps): void;
}

export namespace IAutoBeInterfaceGroupApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getPreviousAnalysisFiles,
     * getDatabaseSchemas, getPreviousDatabaseSchemas):
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
     * (getAnalysisFiles, getPreviousAnalysisFiles, getDatabaseSchemas,
     * getPreviousDatabaseSchemas) or final group generation (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
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
   * Request to generate API endpoint groups.
   *
   * Executes group generation to organize API endpoints based on database schema
   * structure.
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
     * Analysis of the database schema structure and grouping needs.
     *
     * Before designing groups, analyze what you know:
     *
     * - What namespaces, prefixes, or organizational patterns exist in the DB?
     * - Which entities naturally belong together based on table relationships?
     * - What business domains or functional areas can be identified?
     * - Are there existing interface operations that suggest grouping patterns?
     */
    analysis: string;

    /**
     * Rationale for the group design decisions.
     *
     * Explain why you organized groups this way:
     *
     * - Why did you create each group?
     * - What entities are included in each group and why?
     * - How does this grouping reflect the database schema structure?
     * - What coverage does this provide for all requirements?
     */
    rationale: string;

    /**
     * Array of API endpoint groups for organizing development.
     *
     * DO: Derive groups from database schema organization (namespaces, file
     * structure, table prefixes) rather than arbitrary business domains. DO:
     * Create new groups only when existing schema structure cannot adequately
     * cover all requirements. DO: Organize groups around existing database schema
     * structure. DO: Provide complete coverage of all entities and requirements
     * without overlap.
     */
    groups: AutoBeInterfaceGroup[] & tags.MinItems<1>;
  }
}
