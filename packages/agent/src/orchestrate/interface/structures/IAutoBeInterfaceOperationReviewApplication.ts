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
   * - description: Can fix soft delete mismatches, inappropriate security
   *   mentions, add schema references
   * - requestBody: Complete object - can modify both description and typeName to
   *   fix clarity issues and naming convention violations
   * - responseBody: Complete object - can modify both description and typeName
   *   to fix clarity issues and naming convention violations
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
     * Comprehensive thinking process for API operation review.
     *
     * Encapsulates the agent's analytical review findings and actionable
     * improvement plan. This structured thinking process ensures systematic
     * evaluation of the API operation against AutoBE's quality standards before
     * generating the final enhanced operation.
     */
    think: IThink;

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
   * - **description**: Operation description text - can fix soft delete
   *   mismatches, remove inappropriate security mentions, add schema references
   * - **requestBody**: Complete request body object (or null) - can modify both
   *   description and typeName to fix naming conventions or improve clarity
   * - **responseBody**: Complete response body object (or null) - can modify
   *   both description and typeName to fix naming conventions or improve clarity
   */
  export interface IOperation extends Pick<
    AutoBeOpenApi.IOperation,
    "description" | "requestBody" | "responseBody"
  > {}

  /**
   * Structured thinking process for operation review.
   *
   * Contains analytical review findings and improvement action plan organized
   * for systematic enhancement of the operation.
   */
  export interface IThink {
    /**
     * Comprehensive operation-level review analysis with prioritized findings.
     *
     * Systematic assessment organized by severity levels (CRITICAL, HIGH,
     * MEDIUM, LOW):
     *
     * - **Authorization Analysis**: `authorizationActor` and `authorizationType`
     *   configuration issues, missing authorization on sensitive operations
     * - **Path Structure Validation**: Composite unique constraint completeness,
     *   unique code usage vs UUID, path-parameter correspondence
     * - **Metadata Consistency**: Method-name alignment (POST→create,
     *   DELETE→erase), typeName conventions, HTTP method semantics
     * - **Description Accuracy**: Operation descriptions contradicting database
     *   schema capabilities (e.g., soft delete mentioned without schema
     *   support), inappropriate security mentions
     *
     * Note: This review focuses on Operation metadata. DTO field-level issues
     * (password fields in response types, missing required fields, etc.) are
     * validated by Schema Review agents.
     *
     * Each finding includes specific examples, current vs expected behavior,
     * and concrete fix recommendations. Critical authorization and path
     * structure issues are highlighted for immediate attention.
     */
    review: string;

    /**
     * Prioritized action plan for identified operation-level issues.
     *
     * Structured improvement strategy categorized by severity:
     *
     * - **Immediate Actions (CRITICAL)**: Authorization configuration failures
     *   (missing `authorizationActor` on sensitive operations), path structure
     *   violations (incomplete composite unique paths)
     * - **Required Fixes (HIGH)**: Metadata consistency issues (method-name
     *   misalignment, typeName convention violations), description accuracy
     *   problems (soft delete mentioned without schema support)
     * - **Recommended Improvements (MEDIUM)**: Suboptimal authorization
     *   configuration, minor path parameter issues
     * - **Optional Enhancements (LOW)**: Description improvements, documentation
     *   enhancements
     *
     * Note: This plan addresses Operation metadata only. DTO field-level fixes
     * (password field removal, required field additions, etc.) are handled by
     * Schema Review agents.
     *
     * If the operation passes review without issues, contains: "No improvements
     * required. The operation meets AutoBE standards."
     *
     * Each action item includes the specific operation path, the exact change
     * needed, and the rationale for the modification.
     */
    plan: string;
  }
}
