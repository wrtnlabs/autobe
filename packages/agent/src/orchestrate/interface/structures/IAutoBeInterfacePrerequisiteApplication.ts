import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryApplication } from "../../common/structures/IAutoBePreliminaryApplication";

/**
 * Interface Prerequisite Agent application for analyzing and generating API
 * operation dependencies.
 *
 * Analyzes Target Operations to determine which Available API Operations must
 * be executed as prerequisites based on resource creation dependencies and
 * existence validations.
 */
export interface IAutoBeInterfacePrerequisiteApplication
  extends IAutoBePreliminaryApplication {
  /**
   * Generate prerequisites for the provided operations.
   *
   * Analyzes each operation's dependencies and returns the complete list with
   * their required prerequisite chains based on resource relationships.
   */
  makePrerequisite(props: IAutoBeInterfacePrerequisiteApplication.IProps): void;
}

export namespace IAutoBeInterfacePrerequisiteApplication {
  export interface IProps {
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
