/**
 * Interface representing a section (### level) within a unit section of an
 * analysis document.
 *
 * Sections are the most granular level of the document hierarchy, containing
 * detailed requirements, specifications, and diagrams. Each section provides
 * implementation-ready content using EARS format for requirements and Mermaid
 * syntax for diagrams.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeSection {
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
