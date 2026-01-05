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
   * Request to review and validate an API operation.
   *
   * Executes systematic operation review for quality and correctness, analyzing
   * security vulnerabilities, schema compliance, logical consistency, and
   * standard adherence. Outputs structured thinking process and the enhanced
   * operation.
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
     * Production-ready operation with all critical issues resolved, or null if
     * the operation should be removed.
     *
     * Final API operation after systematic enhancement:
     *
     * - **Security Fixes Applied**: All authentication boundaries enforced,
     *   sensitive data removed from responses, proper authorization
     *   implemented
     * - **Logic Corrections Made**: Return types match operation intent, HTTP
     *   methods align with semantics, parameters properly utilized
     * - **Schema Alignment Verified**: All fields exist in database schema, types
     *   correctly mapped, relationships properly defined
     * - **Quality Improvements Added**: Enhanced documentation, format
     *   specifications, validation rules, consistent naming patterns
     *
     * If no issues were found during review, this contains the exact original
     * operation unchanged. If the operation violates fundamental architectural
     * principles or should be removed entirely, this is null. The operation is
     * validated and ready for schema generation and subsequent implementation
     * phases.
     */
    content: AutoBeOpenApi.IOperation | null;
  }

  /**
   * Structured thinking process for operation review.
   *
   * Contains analytical review findings and improvement action plan organized
   * for systematic enhancement of the operation.
   */
  export interface IThink {
    /**
     * Comprehensive review analysis with prioritized findings.
     *
     * Systematic assessment organized by severity levels (CRITICAL, HIGH,
     * MEDIUM, LOW):
     *
     * - **Security Analysis**: Authentication boundary violations, exposed
     *   passwords/tokens, unauthorized data access patterns, SQL injection
     *   risks
     * - **Logic Validation**: Return type consistency (list operations returning
     *   arrays, single retrieval returning single items), HTTP method semantics
     *   alignment, parameter usage verification
     * - **Schema Compliance**: Field existence in database schema, type accuracy,
     *   relationship validity, required field handling
     * - **Quality Assessment**: Documentation completeness, naming conventions,
     *   error handling patterns, pagination standards
     *
     * Each finding includes specific examples, current vs expected behavior,
     * and concrete fix recommendations. Critical security issues and logical
     * contradictions are highlighted for immediate attention.
     */
    review: string;

    /**
     * Prioritized action plan for identified issues.
     *
     * Structured improvement strategy categorized by severity:
     *
     * - **Immediate Actions (CRITICAL)**: Security vulnerabilities that must be
     *   fixed before production (password exposure, missing authorization,
     *   authentication bypass risks)
     * - **Required Fixes (HIGH)**: Functional issues affecting API correctness
     *   (wrong return types, missing required fields, schema mismatches)
     * - **Recommended Improvements (MEDIUM)**: Quality enhancements for better
     *   API design (validation rules, format specifications, consistency)
     * - **Optional Enhancements (LOW)**: Documentation and usability improvements
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
