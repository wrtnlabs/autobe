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
     * Step 1 (CoT: Plan Phase) - Document Planning Structure
     *
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
     * - User actors and authentication requirements
     * - Functional requirements with EARS format
     * - Non-functional requirements
     * - Business requirements in natural language
     * - User scenarios and use cases
     */
    plan: string;

    /**
     * Step 2 (CoT: Write Phase) - Complete Document Content
     *
     * The complete, production-ready markdown document content to be saved.
     *
     * Requirements:
     *
     * - Minimum 5,000 characters for technical documents
     * - Uses EARS format for all applicable requirements
     * - Includes proper Mermaid diagram syntax (double quotes for labels)
     * - Focuses on business requirements in natural language
     * - PROHIBITED: Database schemas, ERD, API specifications
     */
    content: string;
  }
}
