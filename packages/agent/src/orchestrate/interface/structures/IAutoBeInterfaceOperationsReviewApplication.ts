import { AutoBeOpenApi } from "@autobe/interface";

/**
 * Application interface for reviewing and validating API operations.
 *
 * Provides functionality to systematically review generated API operations
 * against business requirements, technical specifications, and OpenAPI
 * standards. The review process outputs a structured thinking process with
 * analytical findings and actionable improvements, along with the final
 * enhanced operations ready for implementation.
 */
export interface IAutoBeInterfaceOperationsReviewApplication {
  /**
   * Reviews a batch of API operations for quality and correctness.
   *
   * Analyzes operations for security vulnerabilities, schema compliance,
   * logical consistency, and standard adherence. Outputs a structured thinking
   * process containing review findings and improvement plans, plus the final
   * production-ready operations with all critical issues resolved.
   *
   * @param input Properties containing the thinking process (review & plan)
   *   and the enhanced operations content
   */
  reviewOperations(
    input: IAutoBeInterfaceOperationsReviewApplication.IProps,
  ): void;
}

export namespace IAutoBeInterfaceOperationsReviewApplication {
  /**
   * Properties for API operation review and improvement process.
   *
   * Contains both the input operations to be reviewed and the outputs generated
   * by the Interface Operations Review Agent, which will be published as part
   * of the AutoBeInterfaceOperationsReviewEvent.
   */
  export interface IProps {
    /**
     * Comprehensive thinking process for API operation review.
     *
     * Encapsulates the agent's analytical review findings and actionable
     * improvement plan. This structured thinking process ensures systematic
     * evaluation of API operations against AutoBE's quality standards before
     * generating the final enhanced operations.
     */
    think: IThink;

    /**
     * Production-ready operations with all critical issues resolved.
     *
     * Final API operations after systematic enhancement:
     *
     * - **Security Fixes Applied**: All authentication boundaries enforced,
     *   sensitive data removed from responses, proper authorization
     *   implemented
     * - **Logic Corrections Made**: Return types match operation intent, HTTP
     *   methods align with semantics, parameters properly utilized
     * - **Schema Alignment Verified**: All fields exist in Prisma schema, types
     *   correctly mapped, relationships properly defined
     * - **Quality Improvements Added**: Enhanced documentation, format
     *   specifications, validation rules, consistent naming patterns
     *
     * If no issues were found during review, this contains the exact original
     * operations unchanged. These operations are validated and ready for schema
     * generation and subsequent implementation phases.
     */
    content: AutoBeOpenApi.IOperation[];
  }

  /**
   * Structured thinking process for comprehensive API operation review.
   *
   * Combines analytical review findings with actionable improvement planning
   * to guide the systematic enhancement of API operations. This thinking
   * structure ensures all aspects of API quality are evaluated and addressed
   * before producing the final operations.
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
     * - **Schema Compliance**: Field existence in Prisma schema, type accuracy,
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
     * If all operations pass review without issues, contains: "No improvements
     * required. All operations meet AutoBE standards."
     *
     * Each action item includes the specific operation path, the exact change
     * needed, and the rationale for the modification.
     */
    plan: string;
  }
}
