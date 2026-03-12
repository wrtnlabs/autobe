import { tags } from "typia";

import { CamelCasePattern } from "../typings/CamelCasePattern";

/**
 * AST type system for requirements analysis phase in the AutoBE pipeline.
 *
 * This namespace defines the structured output types that AI agents produce
 * during the Analyze phase, which transforms natural language requirements into
 * structured planning documents. The analysis follows a hierarchical document
 * structure:
 *
 * ## Document Hierarchy
 *
 * - **IFile**: Complete analysis document with metadata and content
 * - **IModule**: Top-level module (# heading) within a document
 * - **IUnit**: Functional grouping (## heading) within a module
 * - **ISection**: Detailed requirements (### heading) within a unit
 *
 * ## Actor System
 *
 * - **IActor**: Authenticated user types that drive authorization logic
 *   throughout the generated application
 *
 * ## Pipeline Role
 *
 * The types defined here serve as the foundation for subsequent phases:
 *
 * - Database schema generation references actors for authentication tables
 * - API endpoint generation uses actors for access control decorators
 * - Test scenarios leverage actors for permission-level testing
 * - Document sections provide evidence for design decisions
 *
 * @author Juntak
 */
export namespace AutoBeAnalyze {
  /**
   * Interface representing a user actor definition in the requirements analysis
   * phase.
   *
   * This interface defines authenticated user actors that will be used
   * throughout the application's authentication and authorization system. Each
   * actor represents a distinct type of user who can register, authenticate,
   * and interact with the system based on their specific permissions and
   * capabilities.
   *
   * The actors defined here serve as the foundation for generating:
   *
   * - Prisma schema models for user authentication tables
   * - API endpoint access control decorators
   * - Actor-based authorization logic in the business layer
   * - Test scenarios for different user permission levels
   */
  export interface IActor {
    /**
     * Unique identifier for the user actor.
     *
     * This name will be used as a reference throughout the generated codebase,
     * including Prisma schema model names, authorization decorator parameters,
     * and API documentation.
     *
     * MUST use camelCase naming convention.
     */
    name: string & CamelCasePattern & tags.MinLength<1>;

    /**
     * Actor category classification for system-wide permission hierarchy.
     *
     * This property categorizes actors into three fundamental permission
     * levels, establishing a clear hierarchy for authorization decisions
     * throughout the application. The kind determines baseline access patterns
     * and security boundaries:
     *
     * - "guest": Unauthenticated users or those with minimal permissions.
     *   Typically limited to public resources and registration/login
     *   endpoints.
     * - "member": Authenticated users with standard access permissions. Can
     *   access personal resources and participate in core application
     *   features.
     * - "admin": System administrators with elevated permissions. Can manage
     *   other users, access administrative functions, and modify system-wide
     *   settings.
     */
    kind: "guest" | "member" | "admin";

    /**
     * Human-readable description of the actor's permissions and capabilities.
     *
     * This description helps the AI agents understand the business context and
     * access requirements for each actor, guiding the generation of appropriate
     * authorization rules and API endpoint restrictions.
     */
    description: string;
  }

  /**
   * Scenario metadata for a single analysis file.
   *
   * Describes the planning context (reason, filename, audience, etc.) for a
   * document to be generated during the Analyze phase. {@link IFile} extends
   * this interface and adds content/structural fields.
   */
  export interface IFileScenario {
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

  /** Planning document structure for the Analyze phase. */
  export interface IFile extends IFileScenario {
    /**
     * Document title (bold text, not a heading).
     *
     * The main title of the requirements document that appears at the top of
     * the generated markdown file.
     */
    title: string;

    /**
     * Executive summary of the document.
     *
     * A concise overview (2-3 sentences) describing the purpose and scope of
     * the requirements document.
     */
    summary: string;

    /**
     * Markdown file content. Only write the content of the file. Do not include
     * any questions. This should contain only the contents of the file. Do not
     * write down any questions or appreciation. For example, remove a sentence
     * such as "Is it okay if we proceed with the table of contents? Please let
     * me know if there is anything to add or exclude from the table of
     * contents!"
     *
     * PROHIBITED content in markdown:
     *
     * - Questions to the reader (e.g., "Is there anything else to refine?")
     * - Feedback requests (e.g., "Please review and let me know")
     * - Interactive elements expecting responses
     * - Meta-commentary about the document writing process
     *
     * The markdown must be a complete, standalone deliverable without any
     * conversational elements. If clarification is needed, it should be
     * requested outside the document content.
     */
    content: string;

    /**
     * Hierarchical content structure (Module → Unit → Section).
     *
     * Preserves the three-level hierarchy that the flat `content` markdown
     * loses. Also serves as the source for the Evidence Layer
     * (`document.sections`), which is generated by walking this tree and
     * assigning `sectionId`s.
     *
     * Document-level metadata (`title`, `summary`) lives directly on `IFile`;
     * this interface represents a single module with `title`, `purpose`,
     * `content`, and `units`.
     */
    module: IModule;
  }

  /**
   * Structured module-level content of an analysis document.
   *
   * Represents a single module in the three-level hierarchy: **Module (#) →
   * Unit (##) → Section (###)**.
   *
   * Document-level metadata (`title`, `summary`) lives on {@link IFile}, not
   * here.
   */
  export interface IModule {
    /** Title of the module (# level heading). */
    title: string;

    /**
     * Purpose statement explaining what this module covers.
     *
     * A brief description (1-2 sentences) of the module's role in the overall
     * document structure.
     */
    purpose: string;

    /**
     * Introductory content for the module.
     *
     * Content that appears after the module heading, before any unit sections.
     */
    content: string;

    /**
     * Array of units (## level) within this module.
     *
     * Units represent functional groupings within a module, each containing
     * detailed section content.
     */
    units: IUnit[];
  }

  /**
   * Interface representing a unit (## level) within a module section of an
   * analysis document.
   *
   * Units represent functional groupings within a module, containing detailed
   * requirements and specifications. Each unit has its own sections (### level)
   * that provide implementation-ready content.
   *
   * The keywords property is particularly important as it provides semantic
   * hints about the topics covered, enabling intelligent search and
   * categorization of requirements.
   */
  export interface IUnit {
    /** Title of the unit (## level heading). */
    title: string;

    /**
     * Purpose statement explaining what this unit covers.
     *
     * A brief description of the unit's role within the parent module.
     */
    purpose: string;

    /**
     * Content for the unit.
     *
     * The main body content that appears after the heading, before any
     * sections.
     */
    content: string;

    /**
     * Keywords that describe the topics covered in this unit.
     *
     * These keywords provide semantic hints for:
     *
     * - Guiding section generation with topic focus
     * - Enabling keyword-based search and filtering
     * - Categorizing requirements by domain concepts
     */
    keywords: string[];

    /**
     * Array of sections (### level) within this unit.
     *
     * Each section contains detailed requirements, specifications, and diagrams
     * that form the implementation-ready content.
     */
    sections: ISection[];
  }

  /**
   * Interface representing a section (### level) within a unit section of an
   * analysis document.
   *
   * Sections are the most granular level of the document hierarchy, containing
   * detailed requirements, specifications, and diagrams. Each section provides
   * implementation-ready content using EARS format for requirements and Mermaid
   * syntax for diagrams.
   */
  export interface ISection {
    /** Title of the section (### level heading). */
    title: string;

    /**
     * Complete content for the section.
     *
     * Contains detailed requirements, specifications, and diagrams. Should use
     * EARS format for requirements and proper Mermaid syntax for any diagrams
     * included.
     */
    content: string;
  }
}
