import { IAutoBePreliminaryGetPreviousAnalysisFiles } from "../../common/structures/IAutoBePreliminaryGetPreviousAnalysisFiles";

export interface IAutoBeAnalyzeWriteApplication {
  /**
   * Process document writing task or preliminary data requests.
   *
   * Creates or updates planning documentation based on the provided plan and
   * content structure. Processes documents with incremental context loading to
   * ensure high-quality technical writing.
   *
   * @param props Request containing either preliminary data request or complete
   *   task
   */
  process(props: IAutoBeAnalyzeWriteApplication.IProps): void;
}

export namespace IAutoBeAnalyzeWriteApplication {
  export interface IProps {
    /**
     * Think before you act.
     *
     * Before requesting preliminary data or completing your task, reflect on
     * your current state and explain your reasoning:
     *
     * For preliminary requests (getAnalysisFiles, getPreviousAnalysisFiles):
     *
     * - What critical information is missing that you don't already have?
     * - Why do you need it specifically right now?
     * - Be brief - state the gap, don't list everything you have.
     *
     * For completion (complete):
     *
     * - What key assets did you acquire?
     * - What did you accomplish?
     * - Why is it sufficient to complete?
     * - Summarize - don't enumerate every single item.
     *
     * This reflection helps you avoid duplicate requests and premature
     * completion.
     */
    thinking: string;

    /**
     * Type discriminator for the request.
     *
     * Determines which action to perform: preliminary data retrieval
     * (getAnalysisFiles, getPreviousAnalysisFiles) or final document writing
     * (complete). When preliminary returns empty array, that type is removed
     * from the union, physically preventing repeated calls.
     */
    request: IComplete | IAutoBePreliminaryGetPreviousAnalysisFiles;
  }

  /**
   * Request to write complete planning documentation.
   *
   * Executes document writing to create production-ready planning documents
   * that will be used by backend developers to understand what needs to be
   * built, why it's being built, and how it should function.
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
