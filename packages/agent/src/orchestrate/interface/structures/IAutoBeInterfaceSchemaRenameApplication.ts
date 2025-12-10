import { AutoBeInterfaceSchemaRefactor } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousPrismaSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeInterfaceSchemaRenameApplication {
  /**
   * Process schema renaming task or preliminary data requests.
   *
   * Analyze DTO type names and identify naming violations with incremental
   * context loading to ensure comprehensive analysis.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceSchemaRenameApplication.IProps): void;
}

export namespace IAutoBeInterfaceSchemaRenameApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getPreviousAnalysisFiles,
     * getPrismaSchemas, getPreviousPrismaSchemas):
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
     * (getAnalysisFiles, getPreviousAnalysisFiles, getPrismaSchemas,
     * getPreviousPrismaSchemas) or final schema renaming (complete). When
     * preliminary returns empty array, that type is removed from the union,
     * physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPreviousAnalysisFiles
      | IAutoBePreliminaryGetPrismaSchemas
      | IAutoBePreliminaryGetPreviousPrismaSchemas;
  }

  /**
   * Request to analyze and rename incorrectly named DTO types.
   *
   * Executes schema renaming to fix naming violations.
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
     * List of refactoring operations to rename incorrectly named DTO types.
     *
     * Each refactor specifies:
     *
     * - `from`: The current INCORRECT type name (e.g., "ISale", "IBbsComment")
     * - `to`: The CORRECT type name with all components preserved (e.g.,
     *   "IShoppingSale", "IBbsArticleComment")
     *
     * IMPORTANT: Only include type names that violate the naming rules. If a
     * type name correctly preserves all components from the table name, do NOT
     * include it in the refactors list.
     *
     * The orchestrator will automatically handle:
     *
     * - Renaming the base type (e.g., ISale → IShoppingSale)
     * - Renaming all variants (e.g., ISale.ICreate → IShoppingSale.ICreate)
     * - Renaming page types (e.g., IPageISale → IPageIShoppingSale)
     * - Updating all $ref references throughout the OpenAPI document
     */
    refactors: AutoBeInterfaceSchemaRefactor[];
  }
}
