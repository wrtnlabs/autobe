import { AutoBeAnalyzeUnit } from "./AutoBeAnalyzeUnit";

/**
 * Interface representing the structured module-level content of an analysis
 * document.
 *
 * This interface preserves the hierarchical structure of requirements analysis
 * documents that would otherwise be lost when assembled into a flat markdown
 * string. By maintaining this structure, the system enables:
 *
 * - Partial modification of specific sections without full regeneration
 * - Structural search and filtering of document content
 * - Hierarchical UI representation with collapsible sections
 * - Easier debugging by tracking which module/unit/section has issues
 *
 * The structure mirrors the three-level hierarchy used during generation:
 * Module (#) → Unit (##) → Section (###)
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeModule {
  /**
   * Document title (bold text, not a heading).
   *
   * The main title of the requirements document that appears at the top of the
   * generated markdown file.
   */
  title: string;

  /**
   * Executive summary of the document.
   *
   * A concise overview (2-3 sentences) describing the purpose and scope of the
   * requirements document.
   */
  summary: string;

  /**
   * Array of modules (# level) in the document.
   *
   * Each module represents a major chapter or topic area in the requirements
   * document, containing its own hierarchy of units and sections.
   */
  modules: AutoBeAnalyzeModule.IModule[];
}

export namespace AutoBeAnalyzeModule {
  /** Structure representing a single module (# level) in the document. */
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
    units: AutoBeAnalyzeUnit[];
  }
}
