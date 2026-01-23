import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";
import { IAutoBePreliminaryGetPreviousDatabaseSchemas } from "../../common/structures/IAutoBePreliminaryGetPreviousDatabaseSchemas";
import { IAutoBePreliminaryGetPreviousInterfaceOperations } from "../../common/structures/IAutoBePreliminaryGetPreviousInterfaceOperations";

export interface IAutoBeInterfaceOperationReviewApplication {
  /**
   * Process operation review task or preliminary data requests.
   *
   * Analyzes the operation for security vulnerabilities, schema compliance,
   * logical consistency, and standard adherence. Outputs structured thinking
   * process and the production-ready operation.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceOperationReviewApplication.IProps): void;
}

export namespace IAutoBeInterfaceOperationReviewApplication {
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
     * (getAnalysisFiles, getDatabaseSchemas) or final operation review
     * (complete). When preliminary returns empty array, that type is removed
     * from the union, physically preventing repeated calls.
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
   * Request to review and validate an API operation with minimal correction
   * power.
   *
   * This agent can ONLY modify fields present in the IOperation type. For
   * issues in fields not present in IOperation, it must reject the operation by
   * returning null.
   *
   * The IOperation type contains only:
   *
   * - Specification: Implementation guidance for Realize Agent - can fix
   *   implementation details, algorithm descriptions, database query logic
   * - Description: API documentation for consumers - can fix soft delete
   *   mismatches, inappropriate security mentions, add schema references
   * - RequestBody: Complete object - can modify both description and typeName to
   *   fix clarity issues and naming convention violations
   * - ResponseBody: Complete object - can modify both description and typeName to
   *   fix clarity issues and naming convention violations
   *
   * Fields not in IOperation cannot be modified - the agent must reject by
   * returning null if those fields have issues.
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
     * Comprehensive operation-level review findings.
     *
     * Systematic assessment of the operation organized by severity:
     *
     * - Authorization configuration issues
     * - Path structure violations
     * - Metadata consistency problems
     * - Description accuracy issues
     *
     * Documents what issues were found during review, with specific examples
     * and current vs expected behavior.
     */
    review: string;

    /**
     * Action plan for identified issues.
     *
     * Structured improvement strategy explaining what corrections will be
     * applied and why:
     *
     * - What specific changes are being made
     * - Why each change is necessary
     * - If rejecting (returning null), why the operation cannot be fixed
     *
     * If no issues found: "No improvements required. Operation meets
     * standards."
     */
    plan: string;

    /**
     * Corrected operation with issues resolved, or null if operation rejected.
     *
     * The agent can only modify fields present in IOperation type (description,
     * requestBody, responseBody).
     *
     * Return values:
     *
     * - **Corrected operation**: If fixable issues were found and corrected in
     *   the modifiable fields
     * - **null**: If operation is perfect OR if issues exist in fields not
     *   present in IOperation type
     *
     * When null is returned:
     *
     * - For perfect operations: means "no changes needed, proceed"
     * - For failed validation: means "reject this operation, remove from
     *   pipeline"
     *
     * The orchestrator will filter out null operations from the final operation
     * list.
     */
    content: IOperation | null;
  }

  /**
   * Operation with ONLY the fields that this agent can modify.
   *
   * This type contains ONLY the modifiable fields. Fields not in this type
   * cannot be modified - if they have issues, the agent must return null.
   *
   * Fields in this type:
   *
   * - **specification**: Implementation guidance for Realize Agent - can fix
   *   implementation details, algorithm descriptions, database query logic
   * - **description**: API documentation for consumers - can fix soft delete
   *   mismatches, remove inappropriate security mentions, add schema
   *   references
   * - **requestBody**: Complete request body object (or null) - can modify both
   *   description and typeName to fix naming conventions or improve clarity
   * - **responseBody**: Complete response body object (or null) - can modify both
   *   description and typeName to fix naming conventions or improve clarity
   */
  export interface IOperation extends Pick<
    AutoBeOpenApi.IOperation,
    "specification" | "description" | "requestBody" | "responseBody"
  > {}
}
