import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired during the review and amendment phase of the requirements
 * analysis process.
 *
 * This event occurs when the Analyze agent is reviewing the drafted
 * requirements analysis and making amendments based on user feedback,
 * clarifications, or additional requirements. The review phase is a critical
 * part of the structured workflow that ensures the analysis accurately captures
 * all business needs and technical specifications before finalization.
 *
 * The review process involves iterative refinement where the agent evaluates
 * the completeness, accuracy, and clarity of the requirements documentation,
 * making necessary adjustments to improve the analysis quality and ensure it
 * properly guides subsequent development phases.
 *
 * @author Kakasoo
 */
export interface AutoBeAnalyzeReviewEvent
  extends AutoBeEventBase<"analyzeReview"> {
  /**
   * Describe briefly why you made this document, and if you have any plans for
   * the next one. This helps maintain context between documents and ensures a
   * logical flow in documentation creation. Example: "To define the core
   * features and user needs for the e-commerce platform before moving on to
   * detailed user flow documentation."
   */
  reason: string;

  /**
   * Document type that determines the structure and content guidelines. This
   * helps the AI understand what kind of document to create and what sections
   * or information should be included. Examples:
   *
   * - "requirement": Functional/non-functional requirements, acceptance criteria
   * - "user-story": User personas, scenarios, and journey descriptions
   * - "user-flow": Step-by-step user interactions and decision points
   * - "business-model": Revenue streams, cost structure, value propositions
   * - "service-overview": High-level service description, goals, and scope
   */
  documentType?: string;

  /**
   * Outline or table of contents that guides the document structure. Each item
   * represents a main section to be covered in the document. The AI will expand
   * each section with appropriate content while maintaining the specified
   * structure. Example: ["Executive Summary", "Problem Statement", "Target
   * Users", "Core Features", "Success Metrics", "Implementation Timeline"]
   */
  outline?: string[];

  /**
   * Target audience for this document. Determines the language, technical
   * depth, and focus areas of the content. If not specified, the document will
   * be written for a general audience with balanced technical and business
   * perspectives. Examples:
   *
   * - "development team": More technical details, implementation considerations
   * - "business stakeholders": Focus on ROI, business value, market opportunity
   * - "end users": User-friendly language, benefits, and use cases
   * - "product managers": Balance of user needs, business goals, and feasibility
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
   * the broader context. These documents should already exist or be planned in
   * the documentation roadmap. Examples: ["00-project-charter.md",
   * "01-market-analysis.md", "02-competitor-research.md"]
   */
  relatedDocuments?: string[];

  /**
   * Specific constraints or requirements for the document. These are must-have
   * elements or considerations that should be included regardless of other
   * factors. The AI will ensure these constraints are met. Examples:
   *
   * - "Must include cost-benefit analysis"
   * - "Focus on mobile-first user experience"
   * - "Include measurable KPIs and success metrics"
   * - "Address data privacy and security concerns"
   * - "Consider scalability for 1M+ users"
   * - "Include timeline and milestone recommendations"
   */
  constraints?: string[];

  /**
   * The filename of the requirements analysis document being generated.
   *
   * Represents the name of the markdown document being created as part of the
   * requirements analysis process.
   */
  filename: string;

  /**
   * Review commentary and amendments being made to the requirements analysis.
   *
   * Contains the agent's assessment of the current analysis state, including
   * identified gaps, improvements being made, clarifications being added, or
   * refinements being applied based on user feedback. This review content
   * provides transparency into the iterative improvement process.
   *
   * The review may include analysis of requirement completeness, identification
   * of missing specifications, clarification of ambiguous requirements, or
   * restructuring of the documentation for better clarity and usability in
   * subsequent development phases.
   */
  review: string;

  /**
   * Current iteration number of the requirements analysis being reviewed.
   *
   * Indicates which version of the requirements analysis is undergoing review
   * and amendment. This step number helps track the iterative refinement
   * process and provides context for understanding how many revision cycles
   * have been completed.
   *
   * The step value increments with each major revision cycle, allowing
   * stakeholders to understand the evolution of the requirements and the level
   * of refinement that has been applied to achieve the final analysis.
   */
  step: number;

  /** Total number of documents to generate. */
  total: number;

  /** Number of documents generated so far. */
  completed: number;
}
