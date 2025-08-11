export interface IAutoBeAnalyzeWriteApplication {
  /**
   * Creates or updates planning documentation based on the provided plan and
   * content structure.
   *
   * This function is called by the AI agent to write detailed planning
   * documents that will be used by backend developers to understand what needs
   * to be built, why it's being built, and how it should function.
   *
   * @param props - The properties containing the document plan and initial
   *   content
   */
  write(props: IAutoBeAnalyzeWriteApplication.IProps): void;
}
export namespace IAutoBeAnalyzeWriteApplication {
  export interface IProps {
    /**
     * The document planning structure that outlines what needs to be written.
     *
     * This includes:
     *
     * - Document title and purpose
     * - Table of contents structure
     * - Key sections to be covered
     * - Relationships with other documents
     * - Target audience (backend developers)
     *
     * The plan serves as a roadmap for the AI agent to ensure all necessary
     * topics are covered in the documentation process.
     *
     * Example plan structure:
     *
     * - Service overview with business model
     * - User roles and authentication requirements
     * - Functional requirements with EARS format
     * - Non-functional requirements
     * - Database schema and ERD
     * - API specifications (as reference, not enforcement)
     */
    plan: string;

    /**
     * The initial content or context for the document being written.
     *
     * This may include:
     *
     * - User requirements and business goals
     * - Existing documentation to build upon
     * - Specific scenarios or use cases to document
     * - Technical constraints or preferences
     * - Related documents for reference
     *
     * The content provides the raw material that the AI agent will transform
     * into structured, developer-ready documentation following the planning
     * guidelines.
     *
     * The AI agent will expand this content into comprehensive documentation
     * that:
     *
     * - Removes all ambiguity for backend developers
     * - Provides specific, measurable requirements
     * - Includes detailed API specifications (40-50+ endpoints for complex
     *   systems)
     * - Documents complete database schemas
     * - Uses EARS format for all applicable requirements
     * - Follows proper document linking conventions
     * - Includes Mermaid diagrams with proper syntax (double quotes mandatory)
     */
    content: string;
  }
}
