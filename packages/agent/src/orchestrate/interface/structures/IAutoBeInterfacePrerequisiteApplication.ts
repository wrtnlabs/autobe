import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetInterfaceOperations";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeInterfacePrerequisiteApplication {
  /**
   * Process prerequisite analysis task or preliminary data requests.
   *
   * Analyzes each operation's dependencies and returns complete list with
   * required prerequisite chains based on resource relationships.
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
     * getInterfaceSchemas) or final prerequisite analysis (complete). When
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
   * Request to analyze and generate API operation prerequisites.
   *
   * Executes prerequisite analysis to determine which Available API Operations
   * must be executed before each Target Operation based on resource creation
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
     * Target operations requiring prerequisite analysis.
     *
     * Each operation will be analyzed for dependency requirements and returned
     * with appropriate prerequisites from Available API Operations.
     */
    operations: IOperation[];
  }

  /**
   * Operation with its analyzed prerequisite dependencies.
   *
   * Represents a single API operation and its complete prerequisite chain
   * needed for successful execution.
   */
  export interface IOperation {
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
