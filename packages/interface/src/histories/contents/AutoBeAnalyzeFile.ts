/**
 * Interface representing a planning document file structure used by the Analyze
 * Agent in the AutoBE system.
 *
 * This interface defines the complete metadata and content structure for
 * documentation generated during the requirements analysis phase. The Analyze
 * Agent uses this structure to create comprehensive planning documents that
 * serve as blueprints for backend developers implementing the system.
 *
 * The documents created using this interface follow a waterfall model approach,
 * where each document builds upon previous ones to form a complete
 * specification before any code is written. These documents are designed to
 * remove all ambiguity and provide developers with actionable, specific
 * requirements.
 *
 * Key characteristics:
 *
 * - Single-pass document creation (no iterations or revisions)
 * - Production-ready specifications on first write
 * - Backend-focused content (no frontend UI/UX requirements)
 * - Minimum 2,000 characters for standard docs, 5,000-30,000+ for technical
 * - Uses EARS (Easy Approach to Requirements Syntax) format
 * - Includes comprehensive API specifications (40-50+ endpoints for complex
 *   systems)
 * - Complete database schemas and business logic
 *
 * @author Kakasoo
 * @since 0.1.0
 * @see IAutoBeAnalyzeWriteApplication - The application interface that uses this structure
 * @see AutoBeAnalyzeScenarioEvent - Event structure for multi-document scenarios
 * @see AutoBeAnalyzeRole - User role definitions used in authentication planning
 */
export interface AutoBeAnalyzeFile extends AutoBeAnalyzeFile.Scenario {
  /**
   * Markdown file content. Only write the content of the file. Do not include
   * any questions. This should contain only the contents of the file. Do not
   * write down any questions or appreciation. For example, remove a sentence
   * such as "Is it okay if we proceed with the table of contents? Please let me
   * know if there is anything to add or exclude from the table of contents!"
   *
   * PROHIBITED content in markdown:
   *
   * - Questions to the reader (e.g., "Is there anything else to refine?")
   * - Feedback requests (e.g., "Please review and let me know")
   * - Interactive elements expecting responses
   * - Meta-commentary about the document writing process
   *
   * The markdown must be a complete, standalone deliverable without any
   * conversational elements. If clarification is needed, it should be requested
   * outside the document content.
   */
  content: string;
}
export namespace AutoBeAnalyzeFile {
  export interface Scenario {
    /**
     * Describe briefly why you made this document, and if you have any plans
     * for the next one. This helps maintain context between documents and
     * ensures a logical flow in documentation creation. Example: "To define the
     * core features and user needs for the e-commerce platform before moving on
     * to detailed user flow documentation."
     */
    reason: string;

    /**
     * Filename to generate or overwrite. Should be descriptive and follow a
     * consistent naming convention. Examples: "01-service-overview.md",
     * "02-user-requirements.md", "03-business-model.md"
     */
    filename: `${string}.md`;

    /**
     * Document type that determines the structure and content guidelines. This
     * helps the AI understand what kind of document to create and what sections
     * or information should be included. Examples:
     *
     * - "requirement": Functional/non-functional requirements, acceptance
     *   criteria
     * - "user-story": User personas, scenarios, and journey descriptions
     * - "user-flow": Step-by-step user interactions and decision points
     * - "business-model": Revenue streams, cost structure, value propositions
     * - "service-overview": High-level service description, goals, and scope
     */
    documentType?: string;

    /**
     * Outline or table of contents that guides the document structure. Each
     * item represents a main section to be covered in the document. The AI will
     * expand each section with appropriate content while maintaining the
     * specified structure. Example: ["Executive Summary", "Problem Statement",
     * "Target Users", "Core Features", "Success Metrics", "Implementation
     * Timeline"]
     */
    outline?: string[];

    /**
     * Target audience for this document. Determines the language, technical
     * depth, and focus areas of the content. If not specified, the document
     * will be written for a general audience with balanced technical and
     * business perspectives. Examples:
     *
     * - "development team": More technical details, implementation considerations
     * - "business stakeholders": Focus on ROI, business value, market opportunity
     * - "end users": User-friendly language, benefits, and use cases
     * - "product managers": Balance of user needs, business goals, and
     *   feasibility
     * - "general": Accessible to all stakeholders (default if not specified)
     */
    audience?: string;

    /**
     * Key questions or concerns this document should address. Helps ensure the
     * document covers all important aspects and doesn't miss critical
     * information. The AI will make sure to answer these questions within the
     * document content. Examples:
     *
     * - "What problem does this service solve?"
     * - "Who are the primary and secondary users?"
     * - "What are the main competitive advantages?"
     * - "How will we measure success?"
     * - "What are the potential risks and mitigation strategies?"
     */
    keyQuestions?: string[];

    /**
     * Level of detail expected in the document. Guides how deeply the AI should
     * explore each topic and how much information to include. Examples:
     *
     * - "high-level overview": Brief, conceptual, focusing on the big picture
     * - "detailed specification": Comprehensive, with specific examples and edge
     *   cases
     * - "executive summary": Concise, focusing on key points and decisions
     * - "moderate detail": Balanced approach with essential details (default)
     */
    detailLevel?: string;

    /**
     * Related documents that this document references or builds upon. Helps
     * maintain consistency across documentation and allows the AI to understand
     * the broader context. These documents should already exist or be planned
     * in the documentation roadmap. Examples: ["00-project-charter.md",
     * "01-market-analysis.md", "02-competitor-research.md"]
     */
    relatedDocuments?: string[];

    /**
     * Specific constraints or requirements for the document. These are
     * must-have elements or considerations that should be included regardless
     * of other factors. The AI will ensure these constraints are met.
     * Examples:
     *
     * - "Must include cost-benefit analysis"
     * - "Focus on mobile-first user experience"
     * - "Include measurable KPIs and success metrics"
     * - "Address data privacy and security concerns"
     * - "Consider scalability for 1M+ users"
     * - "Include timeline and milestone recommendations"
     */
    constraints?: string[];
  }
}
