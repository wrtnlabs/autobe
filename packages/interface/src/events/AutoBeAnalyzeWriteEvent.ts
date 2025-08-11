import { AutoBeEventBase } from "./AutoBeEventBase";

/**
 * Event fired during the writing phase of the requirements analysis process.
 *
 * This event occurs when the Analyze agent is actively drafting the
 * requirements analysis documents, transforming user conversations and business
 * needs into structured markdown documentation. The writing phase represents
 * the core content creation stage where business requirements, technical
 * specifications, and architectural decisions are being documented.
 *
 * The write event provides visibility into the document creation process,
 * allowing stakeholders to monitor progress and understand what documentation
 * is being generated as part of the comprehensive requirements analysis that
 * will guide the entire development pipeline.
 *
 * @author Kakasoo
 */
export interface AutoBeAnalyzeWriteEvent
  extends AutoBeEventBase<"analyzeWrite"> {
  /**
   * The filename of the requirements analysis document being generated.
   *
   * Represents the name of the markdown document being created as part of the
   * requirements analysis process.
   */
  filename: string;

  /**
   * The content of the requirements analysis document being generated.
   *
   * Contains the markdown content being written for the requirements analysis.
   * This content captures business context, functional requirements, technical
   * specifications, architectural decisions, and implementation guidelines.
   *
   * The content represents work-in-progress documentation that will undergo
   * review and refinement before being finalized. This intermediate state
   * provides transparency into the analysis generation process and allows for
   * early feedback on the documentation structure and content.
   */
  content: string;

  /**
   * Current iteration number of the requirements analysis being written.
   *
   * Indicates which version of the requirements analysis is being drafted. This
   * step number provides context for understanding whether this is an initial
   * draft or a revision being written based on previous feedback or additional
   * requirements gathering.
   *
   * The step value helps track the iterative nature of requirements development
   * and correlates the writing activity with the overall requirements evolution
   * process throughout the project lifecycle.
   */
  step: number;

  /** Total number of documents to generate. */
  total: number;

  /** Number of documents generated so far. */
  completed: number;
}
