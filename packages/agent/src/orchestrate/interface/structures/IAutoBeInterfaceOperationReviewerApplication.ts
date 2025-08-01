

export interface IAutoBeInterfaceOperationReviewerApplication {
  /**
   * Review API operations for correctness, quality, and completeness.
   *
   * This function systematically inspects generated API operations to ensure:
   * - Parameters and return types are correctly utilized
   * - Description comments are comprehensive and detailed
   * - Operations follow proper REST API design patterns
   * - Security considerations are properly addressed
   * - All operations align with business requirements
   *
   * The reviewer will provide detailed feedback on any issues found and
   * suggest specific improvements for better API design and documentation.
   *
   * @param props Properties containing the review analysis and decision.
   */
  reviewOperations(props: IAutoBeInterfaceOperationReviewerApplication.IProps): void;
}

export namespace IAutoBeInterfaceOperationReviewerApplication {
  export interface IProps {
    /**
     * Comprehensive thinking plan and analysis before making the review decision.
     *
     * This field should contain detailed step-by-step analysis including:
     * - Review of each operation's purpose and functionality
     * - Validation of parameter types and their usage
     * - Assessment of return type appropriateness
     * - Evaluation of description quality and completeness
     * - Security considerations and potential issues
     * - REST API design pattern compliance
     * - Business logic alignment
     *
     * The thinking plan should demonstrate thorough consideration of all
     * aspects before reaching the final decision.
     */
    thinkingPlan: string;

    /**
     * The review decision and reasoning.
     *
     * This should contain:
     * - Overall assessment of the operations
     * - Specific issues found (if any)
     * - Recommendations for improvement
     * - Justification for accept/reject decision
     */
    decision: "accept" | "reject";

    /**
     * Detailed explanation of the decision.
     *
     * For "reject" decisions: Specific issues found and required fixes
     * For "accept" decisions: Confirmation that all criteria are met
     */
    reasoning: string;
  }
}