import { AutoBeAnalyzeUnit } from "./AutoBeAnalyzeUnit";

/**
 * Structured module-level content of an analysis document.
 *
 * Represents a single module in the three-level hierarchy: **Module (#) → Unit
 * (##) → Section (###)**.
 *
 * This tree is walked programmatically to produce the Evidence Layer
 * (`AutoBeAnalyzeDocument.sections`), where each node receives a `sectionId`
 * that the Semantic Layer references via `sourceSectionIds`.
 *
 * Document-level metadata (`title`, `summary`) lives on
 * {@link AutoBeAnalyzeFile}, not here.
 *
 * @author Juntak
 */
export interface AutoBeAnalyzeModule {
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
