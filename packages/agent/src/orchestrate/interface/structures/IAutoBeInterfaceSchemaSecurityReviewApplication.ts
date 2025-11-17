import { AutoBeOpenApi } from "@autobe/interface";

import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetInterfaceSchemas } from "../../common/structures/IAutoBePreliminaryGetInterfaceSchemas";
import { IAutoBePreliminaryGetPrismaSchemas } from "../../common/structures/IAutoBePreliminaryGetPrismaSchemas";

export interface IAutoBeInterfaceSchemaSecurityReviewApplication {
  /**
   * Process schema security review task or preliminary data requests.
   *
   * Reviews and validates OpenAPI schema definitions for security compliance,
   * enforcing strict policies to prevent authentication bypass, data exposure,
   * and unauthorized access.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeInterfaceSchemaSecurityReviewApplication.IProps): void;
}

export namespace IAutoBeInterfaceSchemaSecurityReviewApplication {
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
     * (getAnalysisFiles, getPrismaSchemas, getInterfaceSchemas) or final schema
     * security review (complete). When preliminary returns empty array, that
     * type is removed from the union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPrismaSchemas
      | IAutoBePreliminaryGetInterfaceSchemas;
  }

  /**
   * Request to review and validate schema security.
   *
   * Executes security review to ensure schemas comply with authentication
   * boundaries, data protection, and system integrity policies. Identifies and
   * removes authentication context, passwords, tokens, system-managed fields, and
   * phantom fields.
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

    /** Security analysis and remediation planning information. */
    think: IThink;

    /**
     * Modified schemas resulting from security fixes.
     *
     * Contains ONLY the schemas that were modified for security reasons during
     * review. This focused output enables precise tracking of security-related
     * changes.
     *
     * Security modifications include:
     *
     * - Removing authentication context fields (user_id, session_id, etc.)
     * - Removing password/token fields from responses
     * - Removing system-managed fields from requests
     * - Removing phantom fields not in Prisma schema
     *
     * Return empty object {} when all schemas are already secure and no
     * security fixes were needed.
     */
    content: Record<string, AutoBeOpenApi.IJsonSchemaDescriptive>;
  }

  /**
   * Structured thinking process for schema security review.
   *
   * Contains analytical review findings and improvement action plan organized
   * for systematic enhancement of the schemas.
   */
  export interface IThink {
    /**
     * Security violation findings from the review process.
     *
     * Documents all security issues discovered during validation, categorized
     * by severity level (CRITICAL, HIGH, MEDIUM, LOW). Each violation includes
     * the affected schema name, field name, and specific security rule
     * violated.
     *
     * Common violations documented:
     *
     * - CRITICAL: Authentication context in requests (bbs_member_id, session_id)
     * - CRITICAL: Password/token exposure in responses
     * - CRITICAL: Phantom fields not existing in Prisma schema
     * - HIGH: System-managed fields in requests
     * - HIGH: Immutable ownership fields in updates
     *
     * Should state "No security violations found." when all schemas pass
     * security validation.
     */
    review: string;

    /**
     * Security remediation actions applied to fix identified violations.
     *
     * Lists all security fixes implemented during the review process, organized
     * by fix type and priority. Each fix documents which field was removed or
     * modified and from which schema.
     *
     * Typical fixes documented:
     *
     * - Authentication context fields removed from request DTOs
     * - Sensitive data removed from response DTOs
     * - Phantom fields deleted to match Prisma schema
     * - System fields removed from client-controllable DTOs
     *
     * Should state "No security issues require fixes. All schemas are secure."
     * when no security modifications were necessary.
     */
    plan: string;
  }
}
