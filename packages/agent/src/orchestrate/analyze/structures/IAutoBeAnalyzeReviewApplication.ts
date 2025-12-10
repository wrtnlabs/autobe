import { IAutoBePreliminaryGetAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetAnalysisFiles";
import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

export interface IAutoBeAnalyzeReviewApplication {
  /**
   * Process document enhancement task or preliminary data requests.
   *
   * Enhances and finalizes planning documentation by retrieving necessary
   * analysis files via RAG (Retrieval-Augmented Generation) and producing
   * improved, complete markdown documents ready for production use.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeAnalyzeReviewApplication.IProps): void;
}

export namespace IAutoBeAnalyzeReviewApplication {
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
     * (getAnalysisFiles, getPreviousAnalysisFiles) or final document
     * enhancement (complete). When preliminary returns empty array, that type
     * is removed from the union, physically preventing repeated calls.
     */
    request:
      | IComplete
      | IAutoBePreliminaryGetAnalysisFiles
      | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to enhance and finalize planning documentation.
   *
   * Executes document enhancement to produce improved, complete markdown
   * documentation following quality standards and best practices. The output
   * is the enhanced document itself, not review comments.
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
     * Enhancement criteria and quality standards.
     *
     * Comprehensive guidelines that define document quality requirements and
     * enhancement strategies. These criteria ensure the final documentation is
     * implementation-ready and removes all ambiguity for backend developers.
     *
     * Key enhancement criteria include:
     *
     * - Minimum document length requirements for thoroughness
     * - Section completeness checks ensuring all required topics are covered
     * - Link validation rules for internal and external references
     * - Mermaid syntax validation (especially parentheses in labels)
     * - Content specificity requirements to avoid vague statements
     * - EARS format compliance for requirements specification
     * - Natural language business requirement descriptions
     *
     * Critical quality standards:
     *
     * - DO: Use double quotes for ALL labels in Mermaid diagrams
     * - DO NOT: Use spaces between brackets and quotes in Mermaid syntax
     * - DO: Make requirements specific and measurable in natural language
     * - DO: Focus on business requirements and user scenarios
     * - DO NOT: Accept documents containing database schemas or API
     *   specifications
     * - DO: Describe business model and authentication requirements in natural
     *   language
     * - DO: Expand brief sections with comprehensive business context
     * - DO: Convert vague statements to EARS format with clear conditions
     *
     * The review criteria guide the enhancement process to ensure production-ready
     * documentation that serves as a solid foundation for subsequent pipeline
     * phases.
     */
    review: string;

    /**
     * Original document structure plan.
     *
     * The document plan that was used to create the initial content draft. This
     * planning blueprint helps the enhancement agent understand the intended
     * structure, organization, and coverage expectations.
     *
     * Understanding from the plan:
     *
     * - Required sections and their purposes
     * - Intended document structure and organization hierarchy
     * - Target audience and documentation purpose
     * - Expected level of detail and technical depth
     * - Content coverage scope and boundaries
     *
     * The enhancer uses this plan to ensure the improved content aligns with the
     * original architectural vision while meeting all quality standards and
     * completeness requirements.
     */
    plan: string;

    /**
     * Enhanced, production-ready markdown document.
     *
     * INPUT: The document written by Write Agent (may have quality issues)
     * OUTPUT: The enhanced, complete markdown document ready for production use
     *
     * Enhancement transformation requirements:
     *
     * - Fix all Mermaid syntax errors (add quotes, fix arrows, proper formatting)
     * - Convert vague statements to EARS format with specific conditions
     * - Expand sections that are too brief with comprehensive business context
     * - Add missing business processes and workflow descriptions
     * - Ensure all sections meet minimum length requirements
     * - Validate and correct all internal and external links
     * - Remove any database schema or API specification details
     * - Enhance business model descriptions with natural language clarity
     * - Improve requirements specificity and measurability
     *
     * Output characteristics:
     *
     * - Must be the actual enhanced document content (not review comments)
     * - Must be valid markdown with proper formatting
     * - Must meet all quality criteria specified in review field
     * - Must align with the original plan structure
     * - Must be implementation-ready for subsequent pipeline phases
     *
     * The enhanced document serves as the authoritative requirements specification
     * that will guide all downstream generation phases (Prisma, Interface, Test,
     * Realize).
     */
    content: string;
  }
}
