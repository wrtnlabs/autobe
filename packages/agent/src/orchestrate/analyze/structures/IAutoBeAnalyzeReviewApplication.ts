export interface IAutoBeAnalyzeReviewApplication {
  /**
   * Enhances and finalizes planning documentation.
   *
   * Receives a draft document and outputs the improved version. The output is
   * the enhanced document itself, not review comments.
   *
   * @param props - Document content, plan, and review criteria
   */
  review(props: IAutoBeAnalyzeReviewApplication.IProps): void;
}

export namespace IAutoBeAnalyzeReviewApplication {
  export interface IProps {
    /**
     * Step 1 (CoT: Review Phase) - Enhancement Criteria
     *
     * The enhancement criteria and guidelines that the agent must follow.
     *
     * This includes:
     *
     * - Minimum document length requirements
     * - Section completeness checks
     * - Link validation rules
     * - Mermaid syntax validation (especially parentheses in labels)
     * - Content specificity requirements
     * - EARS format compliance
     *
     * The review criteria ensure that documentation is implementation-ready and
     * removes all ambiguity for backend developers.
     *
     * Critical review points:
     *
     * - DO: Use double quotes for ALL labels in Mermaid diagrams
     * - DO NOT: Use spaces between brackets and quotes in Mermaid
     * - DO: Make requirements specific and measurable in natural language
     * - DO: Focus on business requirements and user scenarios
     * - DO NOT: Accept documents containing database schemas or API
     *   specifications
     * - DO: Describe business model and authentication requirements in natural
     *   language
     */
    review: string;

    /**
     * Step 2 (CoT: Plan Phase) - Original Document Plan
     *
     * The document plan that was used to create the content.
     *
     * This helps the reviewer understand:
     *
     * - What sections should be present
     * - The intended structure and organization
     * - The target audience and purpose
     * - Expected level of detail
     *
     * The enhancer uses this to ensure the improved content aligns with the
     * original plan and covers all required topics comprehensively.
     */
    plan: string;

    /**
     * Step 3 (CoT: Content Phase) - Document Content (INPUT → OUTPUT)
     *
     * INPUT: The document written by Write Agent (may have issues) OUTPUT: The
     * enhanced, complete markdown document to be saved
     *
     * Enhancement requirements:
     *
     * - Fix Mermaid syntax errors (add quotes, fix arrows)
     * - Convert vague statements to EARS format
     * - Expand sections that are too brief
     * - Add missing business processes
     *
     * Output must be the actual document content (not review comments).
     */
    content: string;
  }
}
