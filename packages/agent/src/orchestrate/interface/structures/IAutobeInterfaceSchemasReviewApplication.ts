import { AutoBeOpenApi } from "@autobe/interface";

export interface IAutoBeInterfaceSchemasReviewApplication {
  /**
   * Analyzes and improves OpenAPI schema definitions.
   *
   * This function receives schema definitions and performs comprehensive review
   * and enhancement. It identifies issues, creates an improvement plan, and
   * produces refined schemas that meet quality standards.
   *
   * The function populates three key outputs:
   *
   * - A detailed review of findings organized by severity
   * - An actionable plan for improvements
   * - Enhanced schemas with all issues resolved
   *
   * @param props Contains review findings, improvement plan, and enhanced
   *   schemas
   */
  review: (props: IAutoBeInterfaceSchemasReviewApplication.IProps) => void;
}

export namespace IAutoBeInterfaceSchemasReviewApplication {
  /**
   * Schema review and enhancement parameters for the review function.
   *
   * When the review function is called, these properties must be populated to
   * complete the schema validation and improvement process. The LLM uses this
   * interface to understand what outputs are required.
   */
  export interface IProps {
    /**
     * Issues and problems found during schema analysis.
     *
     * IMPORTANT: Only document problems that need fixing. Do NOT include:
     *
     * - Positive feedback about what's already correct
     * - Compliments about well-structured schemas
     * - Confirmation that certain aspects meet standards
     *
     * Focus exclusively on issues organized by severity:
     *
     * - CRITICAL: Security vulnerabilities (exposed passwords, missing auth
     *   boundaries)
     * - HIGH: Missing required variants, incorrect type mappings
     * - MEDIUM: Missing format specifications, incomplete relationships
     * - LOW: Documentation improvements, style consistency
     *
     * Each issue must include the specific schema name and what needs to be
     * fixed. If there are no issues at all, simply state: "No issues found."
     */
    review: string;

    /**
     * Action plan for addressing identified issues.
     *
     * Must specify concrete fixes categorized by priority:
     *
     * - For perfect schemas: "No improvements required. All schemas meet AutoBE
     *   standards."
     * - For fixable issues: List each fix with operation path and exact change
     * - For critical problems: Describe how schemas were recreated or corrected
     *
     * Never leave this empty. Always provide a clear plan even if no changes
     * are needed. The plan documents what was done to produce the content
     * field.
     */
    plan: string;

    /**
     * Final validated and enhanced schemas ready for production use.
     *
     * CRITICAL REQUIREMENTS:
     *
     * - MUST NEVER be an empty object {}
     * - MUST contain valid OpenAPI schema definitions
     * - MUST include all entities that were in the original input
     * - If original schemas have critical issues, MUST contain fixed versions
     * - If entity names are wrong, MUST contain renamed correct versions
     * - If schemas are missing variants, MUST include the created variants
     *
     * FORBIDDEN:
     *
     * - Empty object {} will cause all schemas to be deleted
     * - Returning undefined or null
     * - Including explanations or excuses in schema descriptions
     * - Leaving broken schemas unfixed
     *
     * When original schemas are beyond repair, recreate them properly based on
     * entity names and context. This field becomes the final schemas used by
     * the system, so it must always contain complete, valid schemas.
     */
    content: Record<
      string,
      AutoBeOpenApi.IJsonSchemaDescriptive<AutoBeOpenApi.IJsonSchema>
    >;
  }
}
