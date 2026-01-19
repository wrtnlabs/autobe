import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";
import { IAutoBePreliminaryGetPreviousInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceSchemas";

export interface IAutoBeInterfacePrerequisiteApplication {
  /**
   * Process prerequisite analysis task or preliminary data requests.
   *
   * Analyzes a single operation's dependencies and returns the complete
   * prerequisite chain based on resource relationships.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfacePrerequisiteApplication.IProps): void;
}

export namespace IAutoBeInterfacePrerequisiteApplication {
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
     * (getAnalysisFiles, getDatabaseSchemas, getInterfaceOperations,
     * getInterfaceSchemas) or final prerequisite analysis (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetDatabaseSchemas
      | IAutoBePreliminaryGetInterfaceOperations
      | IAutoBePreliminaryGetInterfaceSchemas
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPreviousDatabaseSchemas
      | IAutoBePreliminaryGetPreviousInterfaceOperations
      | IAutoBePreliminaryGetPreviousInterfaceSchemas;
  }

  /**
   * Request to analyze and generate API operation prerequisites.
   *
   * Executes prerequisite analysis to determine which Available API Operations
   * must be executed before the target operation based on resource creation
   * dependencies and existence validations.
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
     * Analysis of the operation's resource dependencies.
     *
     * Before determining prerequisites, analyze what you know:
     *
     * - What resources does this operation require to exist?
     * - What foreign key relationships affect this operation?
     * - What path parameters imply resource dependencies?
     * - What request body fields reference other resources?
     */
    analysis: string;

    /**
     * Rationale for the prerequisite chain decisions.
     *
     * Explain why you selected these prerequisites:
     *
     * - Why is each prerequisite operation necessary?
     * - What resource must exist before this operation can succeed?
     * - What is the correct ordering of prerequisite operations?
     * - What prerequisites were excluded and why?
     */
    rationale: string;

    /**
     * The API endpoint being analyzed.
     *
     * Identifies the specific operation (method + path) that needs
     * prerequisites.
     */
    endpoint: AutoBeOpenApi.IEndpoint;

    /**
     * Required prerequisite operations.
     *
     * List of API operations that must be successfully executed before this
     * operation can be performed. Based on resource creation dependencies and
     * existence validations from the analysis.
     */
    prerequisites: AutoBeOpenApi.IPrerequisite[];
  }
}
