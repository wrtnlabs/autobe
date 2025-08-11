export interface IAutoBeAnalyzeReviewApplication {
  /**
   * Reviews planning documentation to ensure it meets all quality standards and
   * requirements.
   *
   * This function performs a comprehensive review of the documentation,
   * checking for:
   *
   * - Document length requirements (2,000-6,000 characters for standard docs,
   *   more for technical)
   * - Completeness of all sections listed in the table of contents
   * - Proper internal linking and anchor references
   * - Correct Mermaid diagram syntax (mandatory double quotes)
   * - Specific, actionable requirements (no vague statements)
   * - Proper EARS format usage
   *
   * The review process either accepts the document or rejects it with specific
   * feedback for improvement.
   *
   * @param props - The properties containing review criteria, plan, and content
   *   to review
   */
  review(props: IAutoBeAnalyzeReviewApplication.IProps): void;
}

export namespace IAutoBeAnalyzeReviewApplication {
  export interface IProps {
    /**
     * The review criteria and guidelines that the agent must follow.
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
     * - Mermaid diagrams MUST use double quotes for ALL labels
     * - No spaces allowed between brackets and quotes in Mermaid
     * - Requirements must be specific and measurable
     * - API specifications should be comprehensive (40-50+ endpoints for complex
     *   systems)
     * - Business model and authentication must be included where applicable
     */
    review: string;

    /**
     * The document plan that was used to create the content.
     *
     * This helps the reviewer understand:
     *
     * - What sections should be present
     * - The intended structure and organization
     * - The target audience and purpose
     * - Expected level of detail
     *
     * The reviewer uses this to ensure the written content aligns with the
     * original plan and covers all required topics comprehensively.
     */
    plan: string;

    /**
     * The actual document content to be reviewed.
     *
     * This is the complete documentation written by the Analyze Write Agent
     * that needs validation. The reviewer will check this content against
     * multiple criteria:
     *
     * - Length and completeness (minimum 2,000 characters, more for technical
     *   docs)
     * - All sections from the plan are fully written
     * - No vague or abstract statements
     * - Proper use of EARS format for requirements
     * - Correct Mermaid diagram syntax (double quotes mandatory)
     * - Appropriate level of detail for backend implementation
     * - Proper document linking (descriptive text, not raw filenames)
     *
     * If issues are found, the reviewer will reject with specific feedback:
     *
     * - Exact character count if too short
     * - Specific sections that need expansion
     * - Mermaid syntax errors with corrections
     * - Vague statements that need clarification
     */
    content: string;
  }
}
