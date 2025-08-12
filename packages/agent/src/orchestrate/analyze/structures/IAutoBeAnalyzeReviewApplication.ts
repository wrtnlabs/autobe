export interface IAutoBeAnalyzeReviewApplication {
  /**
   * Enhances planning documentation to meet all quality standards and requirements.
   *
   * This function receives a document and outputs an improved version directly.
   * The output IS the enhanced document itself, NOT review comments or feedback.
   *
   * The enhancement process includes:
   * - Expanding sections that are too brief
   * - Converting vague statements to specific EARS format requirements
   * - Fixing Mermaid diagram syntax errors
   * - Adding missing business processes and workflows
   * - Ensuring proper document structure and completeness
   *
   * CRITICAL: The function outputs the actual document content that will be saved,
   * not a review or analysis of the document. Any text output becomes part of
   * the final document.
   *
   * @param props - The properties containing the document to enhance along with
   *   plan and review criteria for guidance
   */
  review(props: IAutoBeAnalyzeReviewApplication.IProps): void;
}

export namespace IAutoBeAnalyzeReviewApplication {
  export interface IProps {
    /**
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
     * - Mermaid diagrams MUST use double quotes for ALL labels
     * - No spaces allowed between brackets and quotes in Mermaid
     * - Requirements must be specific and measurable in natural language
     * - Focus on business requirements and user scenarios
     * - STRICTLY PROHIBITED: Reject if document contains database schemas or API
     *   specifications
     * - Business model and authentication requirements must be described in
     *   natural language
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
     * The enhancer uses this to ensure the improved content aligns with the
     * original plan and covers all required topics comprehensively.
     */
    plan: string;

    /**
     * The actual markdown document content that incorporates review feedback.
     *
     * ⚠️ CRITICAL: This field contains a COMPLETE MARKDOWN DOCUMENT that has 
     * already incorporated the review criteria and plan requirements. This is 
     * NOT raw input to be reviewed - it is the FINAL, PRODUCTION-READY DOCUMENT
     * that reflects all review feedback and is immediately usable.
     * 
     * This content represents:
     * - A fully-formed markdown document (.md file)
     * - The result of applying review criteria to the original plan
     * - A production-ready document for immediate deployment
     * - Complete business requirements ready for developers
     * 
     * The enhancer should treat this as the actual document content:
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
     * IMPORTANT: The enhancer's output IS this document, not comments about it:
     *
     * - If content is provided, it represents the actual document
     * - The enhancer outputs the enhanced version AS the document itself
     * - No meta-commentary or review feedback should be in the output
     * - The output becomes the saved .md file directly
     * 
     * Example of what this field contains:
     * "# Service Overview\n## Vision\nThe service provides..." (actual document)
     * NOT: "This document should cover service overview..." (review comment)
     */
    content: string;
  }
}
