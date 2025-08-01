

export interface IAutoBeInterfaceSchemaReviewerApplication {
  /**
   * Review schema components for security, correctness, and quality.
   *
   * This function systematically inspects generated schema components to ensure:
   * - No sensitive information (passwords, secrets) exposed in response types
   * - Schema structures are appropriate for their intended use
   * - Property descriptions are comprehensive and aligned with Prisma schema
   * - Security considerations are properly addressed
   * - All schemas follow established naming conventions
   * - Type definitions are accurate and complete
   *
   * The reviewer will identify security violations, structural issues, and
   * provide specific recommendations for improving schema design and
   * documentation quality.
   *
   * @param props Properties containing the review analysis and decision.
   */
  reviewSchemas(props: IAutoBeInterfaceSchemaReviewerApplication.IProps): void;
}

export namespace IAutoBeInterfaceSchemaReviewerApplication {
  export interface IProps {
    /**
     * Comprehensive thinking plan and analysis before making the review decision.
     *
     * This field should contain detailed step-by-step analysis including:
     * - Review of each schema's purpose and structure
     * - Security audit for sensitive data exposure
     * - Validation of property types and constraints
     * - Assessment of description quality and completeness
     * - Naming convention compliance check
     * - Relationship consistency with database schema
     * - Business logic alignment verification
     *
     * The thinking plan should demonstrate thorough security and structural
     * analysis before reaching the final decision.
     */
    thinkingPlan: string;

    /**
     * The review decision and reasoning.
     *
     * This should contain:
     * - Overall security and quality assessment
     * - Specific security violations found (if any)
     * - Structural or design issues identified
     * - Recommendations for improvement
     * - Justification for accept/reject decision
     */
    decision: "accept" | "reject";

    /**
     * Detailed explanation of the decision.
     *
     * For "reject" decisions: Specific security issues, structural problems,
     * and required fixes with examples
     * For "accept" decisions: Confirmation that all security and quality
     * criteria are met
     */
    reasoning: string;
  }
}