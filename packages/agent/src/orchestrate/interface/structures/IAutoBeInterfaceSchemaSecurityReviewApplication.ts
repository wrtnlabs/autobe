import { AutoBeOpenApi } from "@autobe/interface";

export interface IAutoBeInterfaceSchemaSecurityReviewApplication {
  /**
   * Reviews and validates OpenAPI schema definitions for security compliance.
   *
   * This specialized security review function focuses exclusively on
   * authentication boundaries, data protection, and system integrity. It
   * enforces strict security policies to prevent authentication bypass, data
   * exposure, and unauthorized access.
   *
   * The review process identifies and removes:
   *
   * - Authentication context fields in request DTOs (e.g., bbs_member_id)
   * - Password and token fields in response DTOs
   * - System-managed fields in request DTOs
   * - Phantom fields that don't exist in Prisma schema
   *
   * @param props Security review results including violations found, fixes
   *   applied, and modified schemas
   */
  review: (
    props: IAutoBeInterfaceSchemaSecurityReviewApplication.IProps,
  ) => void;
}

export namespace IAutoBeInterfaceSchemaSecurityReviewApplication {
  /**
   * Output structure for the security review function.
   *
   * Contains the security analysis, remediation actions, and schemas modified
   * for security compliance during the validation process.
   */
  export interface IProps {
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
